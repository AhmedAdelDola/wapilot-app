import React, { Component, ReactNode } from 'react';
import { SafeAreaView, Text, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {i18n.t('ERRORS.UNEXPECTED_TITLE') || 'Something went wrong'}
            </Text>
            <Text style={styles.description}>
              {i18n.t('ERRORS.UNEXPECTED_DESCRIPTION') || 'An unexpected error occurred.'}
            </Text>
            {this.state.error && (
              <ScrollView style={styles.errorBox}>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
                )}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>{i18n.t('ERRORS.TRY_AGAIN') || 'Try Again'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  description: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginTop: 8 },
  errorBox: {
    maxHeight: 200,
    width: '100%',
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  errorText: { fontSize: 12, color: '#DC2626', fontFamily: 'monospace' },
  stackText: { fontSize: 10, color: '#6B7280', fontFamily: 'monospace', marginTop: 4 },
  button: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
