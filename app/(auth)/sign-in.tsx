import {View, Text} from 'react-native'
import React from 'react'
import {Link} from "expo-router";

const SignIn = () => {
    return (
        <View>
            <Text>SignUp</Text>
            <Link href="/(auth)/sign-up">Create Account</Link>
        </View>
    )
}
export default SignIn
