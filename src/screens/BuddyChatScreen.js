import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { sendMessageToBuddy, getBuddyGreeting, getBuddySuggestions } from '../services/buddyChat';

// Format timestamp for messages
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Message Bubble Component
const MessageBubble = ({ message, isUser, isTyping }) => {
  return (
    <View style={[
      styles.messageRow,
      isUser ? styles.messageRowUser : styles.messageRowAi,
    ]}>
      {!isUser && (
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.avatarImage}
          resizeMode="contain"
        />
      )}
      <View style={styles.messageContent}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : styles.messageBubbleAi,
        ]}>
          {isTyping ? (
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, styles.typingDot1]} />
              <View style={[styles.typingDot, styles.typingDot2]} />
              <View style={[styles.typingDot, styles.typingDot3]} />
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isUser ? styles.messageTextUser : styles.messageTextAi,
            ]}>
              {message.text}
            </Text>
          )}
        </View>
        {!isTyping && (
          <Text style={[
            styles.messageTime,
            isUser ? styles.messageTimeUser : styles.messageTimeAi,
          ]}>
            {formatTime(message.timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
};

const BuddyChatScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const { initialMessage } = route.params || {};
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const suggestions = getBuddySuggestions();

  // Initialize chat with greeting or initial message
  useEffect(() => {
    const initializeChat = async () => {
      if (initialMessage) {
        // If there's an initial message from suggestion cards, send it
        const userMsg = {
          id: '1',
          text: initialMessage,
          isUser: true,
          timestamp: new Date(),
        };
        setMessages([userMsg]);
        
        // Get Buddy's response
        setIsLoading(true);
        const response = await sendMessageToBuddy([], initialMessage);
        setIsLoading(false);
        
        const aiMsg = {
          id: '2',
          text: response.message,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    };
    
    initializeChat();
  }, [initialMessage]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const currentInput = inputText.trim();
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Scroll to bottom after sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Get AI response
    setIsLoading(true);
    
    // Scroll to show typing indicator
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const response = await sendMessageToBuddy(messages, currentInput);
    setIsLoading(false);

    const aiResponse = {
      id: (Date.now() + 1).toString(),
      text: response.message,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiResponse]);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSuggestionPress = (suggestion) => {
    // Remove emoji from suggestion for cleaner input
    const cleanSuggestion = suggestion.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    setInputText(cleanSuggestion);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Buddy</Text>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.emptyLogo}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Hey there! 👋</Text>
            <Text style={styles.emptySubtitle}>
              I'm Buddy, your fitness companion! Ask me anything about weight loss, meal plans, workouts, or staying motivated. I'm here to help you crush your goals! 💪
            </Text>
          </View>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isUser={message.isUser} 
              />
            ))}
            {isLoading && (
              <MessageBubble 
                message={{ text: '', timestamp: new Date() }} 
                isUser={false}
                isTyping={true}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Quick Suggestions (when empty or few messages) */}
      {messages.length < 2 && !isLoading && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Buddy anything..."
            placeholderTextColor={Colors.dark.textSecondary}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() && !isLoading ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.dark.textSecondary} />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? '#FFFFFF' : Colors.dark.textSecondary} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 44,
    height: 44,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  onlineText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: '#4CAF50',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageRowAi: {
    alignSelf: 'flex-start',
  },
  avatarImage: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  messageContent: {
    flex: 1,
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  messageBubbleUser: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleAi: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextAi: {
    color: Colors.dark.textPrimary,
  },
  messageTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  messageTimeUser: {
    textAlign: 'right',
  },
  messageTimeAi: {
    textAlign: 'left',
  },
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.textSecondary,
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 40,
  },
  emptyLogo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Suggestions
  suggestionsContainer: {
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.surface,
  },
  suggestionsScroll: {
    paddingHorizontal: Spacing.md,
  },
  suggestionChip: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(232, 93, 4, 0.3)',
  },
  suggestionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
  },
  // Input
  inputContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.surface,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.md,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  sendButtonInactive: {
    backgroundColor: 'transparent',
  },
});

export default BuddyChatScreen;
