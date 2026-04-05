import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter, type Href } from 'expo-router';
import { useSignIn } from '@clerk/expo';
import { useState } from 'react';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { usePostHog } from 'posthog-react-native';
import { hashEmail } from '@/lib/utils';

const SafeAreaView = styled(RNSafeAreaView);

const SignIn = () => {
    const { signIn, errors, fetchStatus } = useSignIn();
    const router = useRouter();
    const posthog = usePostHog();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    // Validation states
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);

    // Client-side validation
    const emailValid = emailAddress.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
    const passwordValid = password.length > 0;
    const formValid = emailAddress.length > 0 && password.length > 0 && emailValid;

    const handleSubmit = async () => {
        if (!formValid) return;

        const { error } = await signIn.password({
            emailAddress,
            password,
        });

        if (error) {
            console.error(JSON.stringify(error, null, 2));
            posthog.capture('user_sign_in_failed', {
                error_message: error.message,
            });
            return;
        }

        if (signIn.status === 'complete') {
             await signIn.finalize({
                 navigate: ({ session, decorateUrl }) => {
                     // Use Clerk user ID for analytics instead of raw email (PII)
                     const userId = session?.user?.id;
                     const emailHash = hashEmail(emailAddress);

                     if (userId) {
                         posthog.identify(userId, {
                             $set: {
                                 email_hash: emailHash,
                             },
                             $set_once: { first_sign_in_date: new Date().toISOString() },
                         });
                     }

                     posthog.capture('user_signed_in', {
                         user_id: userId,
                     });

                     // Handle pending task or navigate to home
                     let url: string;
                     if (session?.currentTask) {
                         url = decorateUrl(session.currentTask.url);
                     } else {
                         url = decorateUrl('/');
                     }

                     if (url.startsWith('http')) {
                         // Only use window.location on web platform
                         if (typeof window !== 'undefined' && window.location) {
                             window.location.href = url;
                         } else {
                             // On native, just use router navigation
                             router.replace(url as Href);
                         }
                     } else {
                         router.replace(url as Href);
                     }
                 },
             });
        } else if (signIn.status === 'needs_second_factor') {
            // Set flag to show MFA verification UI
            setMfaRequired(true);
            // Send the second factor verification code
            const emailCodeFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === 'email_code'
            );
            if (emailCodeFactor) {
                await signIn.mfa.sendEmailCode();
            }
        } else if (signIn.status === 'needs_client_trust') {
            // Send email code for client trust verification
            const emailCodeFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === 'email_code'
            );

            if (emailCodeFactor) {
                await signIn.mfa.sendEmailCode();
            }
        } else {
            console.error('Sign-in attempt not complete:', signIn);
        }
    };

    const handleVerify = async () => {
        try {
            // Clear any previous verification errors
            setVerificationError(null);

            await signIn.mfa.verifyEmailCode({ code });

             if (signIn.status === 'complete') {
                 await signIn.finalize({
                     navigate: ({ session, decorateUrl }) => {
                         // Track successful sign-in after verification using non-PII identifier
                         const userId = session?.user?.id;
                         const emailHash = hashEmail(emailAddress);

                         if (userId) {
                             posthog.identify(userId, {
                                 $set: {
                                     email_hash: emailHash,
                                 },
                                 $set_once: { first_sign_in_date: new Date().toISOString() },
                             });
                         }

                         posthog.capture('user_signed_in', {
                             user_id: userId,
                         });

                         // Handle pending task or navigate to home
                         let url: string;
                         if (session?.currentTask) {
                             url = decorateUrl(session.currentTask.url);
                         } else {
                             url = decorateUrl('/');
                         }

                         if (url.startsWith('http')) {
                             // Only use window.location on web platform
                             if (typeof window !== 'undefined' && window.location) {
                                 window.location.href = url;
                             } else {
                                 // On native, just use router navigation
                                 router.replace(url as Href);
                             }
                         } else {
                             router.replace(url as Href);
                         }
                     },
                 });
             } else {
                 console.error('Sign-in attempt not complete:', signIn);
            }
        } catch (error) {
            console.error('Email verification failed:', error);

            // Set user-friendly error message
            const errorMessage =
                error instanceof Error && error.message
                    ? error.message
                    : 'Verification failed. Please check your code and try again.';

            setVerificationError(errorMessage);
            posthog.capture('user_sign_in_verification_failed', {
                error_message: errorMessage,
            });
        }
    };

    // Show verification screen if client trust or MFA is needed
    if (signIn.status === 'needs_client_trust' || mfaRequired) {
        const isMFA = mfaRequired;
        const verificationTitle = isMFA ? 'Verify your identity - Second Factor' : 'Verify your identity';
        const verificationSubtitle = isMFA
            ? 'Enter the verification code sent to your email'
            : 'We sent a verification code to your email';

        return (
            <SafeAreaView className="auth-safe-area">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="auth-screen"
                >
                    <ScrollView
                        className="auth-scroll"
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="auth-content">
                            {/* Branding */}
                            <View className="auth-brand-block">
                                <View className="auth-logo-wrap">
                                    <View className="auth-logo-mark">
                                        <Text className="auth-logo-mark-text">R</Text>
                                    </View>
                                    <View>
                                        <Text className="auth-wordmark">Recurrly</Text>
                                        <Text className="auth-wordmark-sub">SUBSCRIPTIONS</Text>
                                    </View>
                                </View>
                                <Text className="auth-title">{verificationTitle}</Text>
                                <Text className="auth-subtitle">
                                    {verificationSubtitle}
                                </Text>
                            </View>

                            {/* Verification Form */}
                            <View className="auth-card">
                                <View className="auth-form">
                                    <View className="auth-field">
                                        <Text className="auth-label">Verification Code</Text>
                                        <TextInput
                                            className="auth-input"
                                            value={code}
                                            placeholder="Enter 6-digit code"
                                            placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                            onChangeText={setCode}
                                            keyboardType="number-pad"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                        />
                                        {verificationError && (
                                            <Text className="auth-error">{verificationError}</Text>
                                        )}
                                        {errors.fields.code && (
                                            <Text className="auth-error">{errors.fields.code.message}</Text>
                                        )}
                                    </View>

                                    <Pressable
                                        className={`auth-button ${(!code || fetchStatus === 'fetching') && 'auth-button-disabled'}`}
                                        onPress={handleVerify}
                                        disabled={!code || fetchStatus === 'fetching'}
                                    >
                                        <Text className="auth-button-text">
                                            {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify'}
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        className="auth-secondary-button"
                                        onPress={() => signIn.mfa.sendEmailCode()}
                                        disabled={fetchStatus === 'fetching'}
                                    >
                                        <Text className="auth-secondary-button-text">Resend Code</Text>
                                    </Pressable>

                                    <Pressable
                                        className="auth-secondary-button"
                                        onPress={() => {
                                            signIn.reset();
                                            setMfaRequired(false);
                                            setCode('');
                                        }}
                                        disabled={fetchStatus === 'fetching'}
                                    >
                                        <Text className="auth-secondary-button-text">
                                            {isMFA ? 'Cancel' : 'Start Over'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // Main sign-in form
    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="auth-screen"
            >
                <ScrollView
                    className="auth-scroll"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="auth-content">
                        {/* Branding */}
                        <View className="auth-brand-block">
                            <View className="auth-logo-wrap">
                                <View className="auth-logo-mark">
                                    <Text className="auth-logo-mark-text">R</Text>
                                </View>
                                <View>
                                    <Text className="auth-wordmark">Recurrly</Text>
                                    <Text className="auth-wordmark-sub">SUBSCRIPTIONS</Text>
                                </View>
                            </View>
                            <Text className="auth-title">Welcome back</Text>
                            <Text className="auth-subtitle">
                                Sign in to continue managing your subscriptions
                            </Text>
                        </View>

                        {/* Sign-In Form */}
                        <View className="auth-card">
                            <View className="auth-form">
                                <View className="auth-field">
                                    <Text className="auth-label">Email Address</Text>
                                    <TextInput
                                        className={`auth-input ${emailTouched && !emailValid && 'auth-input-error'}`}
                                        autoCapitalize="none"
                                        value={emailAddress}
                                        placeholder="name@example.com"
                                        placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                        onChangeText={setEmailAddress}
                                        onBlur={() => setEmailTouched(true)}
                                        keyboardType="email-address"
                                        autoComplete="email"
                                    />
                                    {emailTouched && !emailValid && (
                                        <Text className="auth-error">Please enter a valid email address</Text>
                                    )}
                                    {errors.fields.identifier && (
                                        <Text className="auth-error">{errors.fields.identifier.message}</Text>
                                    )}
                                </View>

                                <View className="auth-field">
                                    <Text className="auth-label">Password</Text>
                                    <TextInput
                                        className={`auth-input ${passwordTouched && !passwordValid && 'auth-input-error'}`}
                                        value={password}
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                        secureTextEntry
                                        onChangeText={setPassword}
                                        onBlur={() => setPasswordTouched(true)}
                                        autoComplete="password"
                                    />
                                    {passwordTouched && !passwordValid && (
                                        <Text className="auth-error">Password is required</Text>
                                    )}
                                    {errors.fields.password && (
                                        <Text className="auth-error">{errors.fields.password.message}</Text>
                                    )}
                                </View>

                                <Pressable
                                    className={`auth-button ${(!formValid || fetchStatus === 'fetching') && 'auth-button-disabled'}`}
                                    onPress={handleSubmit}
                                    disabled={!formValid || fetchStatus === 'fetching'}
                                >
                                    <Text className="auth-button-text">
                                        {fetchStatus === 'fetching' ? 'Signing In...' : 'Sign In'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Sign-Up Link */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Don't have an account?</Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <Pressable>
                                    <Text className="auth-link">Create Account</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;