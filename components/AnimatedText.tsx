import { View, type StyleProp, type TextStyle } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'


// === TYPES & INTERFACES ==================================================================

interface AnimatedTextProps {
    text: string
    // Applied to the text itself. Don't wrap this component in a <Text> to style it:
    // it renders a View, and nested text styles don't reach it
    style?: StyleProp<TextStyle>
}


// === COMPONENT: ANIMATEDTEXT =============================================================

// Crossfades (with a small vertical slide) whenever `text` changes, e.g. 22°C → 71°F.
// Keyed on the full string so a new value and its unit symbol always swap together.
export function AnimatedText({ text, style }: AnimatedTextProps) {
    return (
        <View>
            <Animated.Text
                key={text}
                entering={FadeInUp.duration(200)}
                exiting={FadeOutUp.duration(200)}
                style={style}
            >
                {text}
            </Animated.Text>
        </View>
    )
}
