import {View, Text} from 'react-native'
import React from 'react'
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";

const SafeAreaView=styled(RNSafeAreaView)

const Subscriptions = () => {
    return (
        <SafeAreaView>
            <Text>Subscriptions</Text>
        </SafeAreaView>
    )
}
export default Subscriptions
