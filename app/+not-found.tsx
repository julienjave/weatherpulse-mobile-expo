import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium" style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Link href="/" asChild>
          <Button mode="contained" style={styles.button}>
            Go to home screen
          </Button>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
});