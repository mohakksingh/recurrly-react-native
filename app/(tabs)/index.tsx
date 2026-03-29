import "@/global.css"
import { Text, View } from "react-native";
import {Link} from "expo-router";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";

const SafeAreaView=styled(RNSafeAreaView)

/**
 * Renders the app's main screen: a styled SafeAreaView containing a heading and navigation links to onboarding, auth, and subscription routes.
 *
 * @returns The root React element for the main application screen.
 */
export default function App() {
    return (
        <SafeAreaView className="flex-1 p-5 bg-background">
            <Text className="text-xl font-bold text-success">
                Welcome to Nativewind!
            </Text>
            <Link href="/onboarding" className="mt-4 rounded bg-primary text-white p-4">Go To Onboarding</Link>
            <Link href="/(auth)/sign-in" className="mt-4 rounded bg-primary text-white p-4">Go To SignIn</Link>
            <Link href="/(auth)/sign-up" className="mt-4 rounded bg-primary text-white p-4">Go To Signup</Link>

            <Link href="/subscriptions/spotify" className="mt-4 rounded bg-primary text-white p-4">Spotify Subscriptions</Link>
            <Link href={{
                pathname:"/subscriptions/[id]",
                params:{id:"claude"},
            }} className="mt-4 rounded bg-primary text-white p-4">Claude Max Subscription</Link>
        </SafeAreaView>
    );
} 