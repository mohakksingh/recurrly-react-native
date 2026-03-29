import {View, Text} from 'react-native'
import React from 'react'
import {Link} from "expo-router";

const SignUp = () => {
    return (
        <View>
            <Text>SignIn</Text>
            <Link href="/(auth)/sign-in">Sign in</Link>
        </View>
    )
}
export default SignUp
