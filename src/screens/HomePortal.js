import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDER_DATA = [
  {
    id: '1',
    image: require('../../assets/1.jpg'),
    title: 'Lightning-Fast Local Delivery',
    description: 'Get your orders delivered in under 20 minutes from local stores.',
  },
  {
    id: '2',
    image: require('../../assets/2.jpg'),
    title: 'Fresh Kirana Groceries',
    description: 'Support local merchants and order daily essentials at best prices.',
  },
  {
    id: '3',
    image: require('../../assets/3.jpg'),
    title: 'Real-Time Stock Checking',
    description: 'Instantly view item availability before placing your order.',
  },
  {
    id: '4',
    image: require('../../assets/4.jpg'),
    title: 'Zero Hidden Charges',
    description: 'Direct retailer prices with transparent delivery payouts.',
  },
];

const CHAT_QUESTIONS = [
  { id: 'maggi', text: 'Is Maggi in stock?', icon: 'cube-outline', query: 'Is Maggi in stock?' },
  { id: 'compare', text: 'Compare store prices', icon: 'git-compare-outline', query: 'Compare store prices' },
  { id: 'stock', text: 'Store stock overview', icon: 'list-circle-outline', query: 'Store stock overview' },
  { id: 'delay', text: 'Track delayed orders', icon: 'time-outline', query: 'Support for delayed orders' },
  { id: 'cancel', text: 'How do I cancel order?', icon: 'close-circle-outline', query: 'How do I cancel my order?' },
  { id: 'payment', text: 'Payment options', icon: 'card-outline', query: 'Simulated payment options' },
  { id: 'location', text: 'Change delivery address', icon: 'pin-outline', query: 'How to change location?' },
  { id: 'wrong', text: 'Report wrong/damaged items', icon: 'warning-outline', query: 'Report damaged or missing items' },
  { id: 'joke', text: 'Tell me a joke!', icon: 'happy-outline', query: 'Tell me a joke' },
];

export default function HomePortal() {
  const { products, selectRole, logoutUser } = useContext(AppContext);
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef(null);
  
  // Chatbot State
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: "Hi there! I'm your NearFind shopping assistant. Ask me about nearby products, prices, or store stock!",
      sender: 'bot',
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef(null);

  // Auto-playing Carousel Logic
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = activeSlide + 1;
      if (nextIndex >= SLIDER_DATA.length) {
        nextIndex = 0;
      }
      setActiveSlide(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [activeSlide]);

  const onScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeSlide && roundIndex >= 0 && roundIndex < SLIDER_DATA.length) {
      setActiveSlide(roundIndex);
    }
  };

  // Heuristic responses for Rule-based Chatbot
  const getHeuristicResponse = (query) => {
    const lower = query.toLowerCase();
    
    // Check product keywords
    let match = null;

    if (lower.includes('maggi') || lower.includes('noodle')) {
      match = products.find(p => p.id === 'maggi');
    } else if (lower.includes('butter') || lower.includes('amul')) {
      match = products.find(p => p.id === 'butter');
    } else if (lower.includes('coke') || lower.includes('cola') || lower.includes('coca')) {
      match = products.find(p => p.id === 'coke');
    } else if (lower.includes('atta') || lower.includes('aashirvaad') || lower.includes('flour')) {
      match = products.find(p => p.id === 'atta');
    } else if (lower.includes('bourbon') || lower.includes('biscuit') || lower.includes('britannia')) {
      match = products.find(p => p.id === 'bourbon');
    }

    if (match) {
      const retailers = Object.entries(match.retailers).map(([id, data]) => {
        return `${data.name} has ${data.stock} units at ₹${data.price} (distance: ${data.distance}km).`;
      });
      return `Here is the stock and price info for *${match.name}*:\n\n` + retailers.join('\n');
    }

    // Compare prices request
    if (lower.includes('compare') || lower.includes('price') || lower.includes('cheapest') || lower.includes('cost')) {
      let text = "Comparing current store prices for you:\n\n";
      products.forEach(p => {
        const prices = Object.entries(p.retailers).map(([id, data]) => `• ${data.name}: ₹${data.price} (${data.stock} in stock)`);
        text += `*${p.name}*:\n${prices.join('\n')}\n\n`;
      });
      return text.trim();
    }

    // Check stock queries general
    if (lower.includes('stock') || lower.includes('avail') || lower.includes('carry')) {
      let text = "Here is our current store inventory overview:\n\n";
      products.forEach(p => {
        const stores = Object.entries(p.retailers)
          .filter(([id, data]) => data.stock > 0)
          .map(([id, data]) => `${data.name} (${data.stock} left)`);
        
        if (stores.length > 0) {
          text += `• *${p.name}*: Available at ${stores.join(', ')}\n`;
        } else {
          text += `• *${p.name}*: Out of stock everywhere!\n`;
        }
      });
      return text;
    }

    // Support: Delivery Delay
    if (lower.includes('delay') || lower.includes('late') || lower.includes('where is my') || lower.includes('delivery time')) {
      return "If your active order is delayed, check the live map tracking inside the 'Shop -> My Orders' tab. Delivery times usually range between 15-20 minutes depending on rider acceptance.";
    }

    // Support: Cancellation & Refund
    if (lower.includes('cancel') || lower.includes('refund') || lower.includes('return')) {
      return "You can request cancellations through customer support prior to store acceptance. If an order is rejected or timed out, your stock is instantly restored, and no payment is charged. Refunds are processed within 2-3 business days.";
    }

    // Support: Payment options
    if (lower.includes('payment') || lower.includes('pay') || lower.includes('card') || lower.includes('cod')) {
      return "NearFind currently supports simulated payments for demonstration purposes. We plan to integrate Stripe, Razorpay, and UPI gateways in our next version.";
    }

    // Support: Address change
    if (lower.includes('address') || lower.includes('change location') || lower.includes('neighborhood')) {
      return "To simulate different delivery destinations, use the neighborhood selector at the top header in the 'Shop' tab. This will instantly adjust store distances and routes.";
    }

    // Support: Damaged or missing items
    if (lower.includes('missing') || lower.includes('wrong') || lower.includes('damaged') || lower.includes('complain')) {
      return "We apologize for the inconvenience! Please contact support at support@nearfind.com with your Order ID, and our customer satisfaction team will issue a refund or redelivery immediately.";
    }

    // General app info
    if (lower.includes('nearfind') || lower.includes('what is') || lower.includes('how does')) {
      return "NearFind is a hyperlocal delivery app that connects customers to nearby Kirana stores (like Sharma Kirana) and lets delivery agents accept jobs to bring items directly to your door in real time!";
    }

    if (lower.includes('joke')) {
      const jokes = [
        "Why did the tomato blush? Because it saw the salad dressing!",
        "What do you call a fake noodle? An imposter!",
        "Why did the grocery store close down? It ran out of thyme!",
        "Why did the butter slide down the hill? To get to the other side!"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      return "Hello! I am your local NearFind assistant. How can I help you find groceries today?";
    }

    // Dynamic Mock LLM Fallback Generator
    const cleaned = query.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
    const words = cleaned.split(/\s+/).filter(w => w.length > 3 && !['what', 'when', 'where', 'your', 'about', 'with', 'this', 'that', 'from', 'have', 'some', 'they', 'them', 'then', 'there', 'here', 'will', 'would', 'could', 'should'].includes(w.toLowerCase()));
    const topics = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    
    if (topics.length > 0) {
      const topicStr = topics.join(' / ');
      const responses = [
        `[NearFind AI Agent] I've analyzed your query regarding "${topicStr}". Our system checks live databases for stores, routes, and transactions. While we are currently in local simulation mode, queries of this type are automatically routed to our Gemini-Flash model to coordinate support tickets or update Kirana inventory syncs!`,
        `[NearFind AI Agent] Received your question about "${topicStr}". Under our standard operation, our LLM support agent reviews this topic to match you with the best store refund policy, rider payout rules, or stock lookup. Let us know if this is about an active order!`,
        `[NearFind AI Agent] Processing query on "${topicStr}"... NearFind's smart assistant can check stock, compare prices, or process cancellations. If you need help with this topic, please specify the item name (e.g. 'Maggi') or order status.`,
      ];
      return responses[cleaned.length % responses.length];
    }

    return "[NearFind AI Agent] I can help you search products, check stock, or resolve support issues (delays, refunds, cancellations). Try asking 'Is Maggi in stock?' or 'How do I cancel my order?'";
  };

  // Send Message Wrapper
  const handleSendMessage = async (textToSend) => {
    if (!textToSend || !textToSend.trim()) return;

    // Append user message
    const userMessage = {
      id: Date.now().toString(),
      text: textToSend.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      let botResponse = '';
      const storedApiKey = await AsyncStorage.getItem('@nearfind_gemini_api_key');

      if (storedApiKey) {
        // Real Gemini REST API Call
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${storedApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are the NearFind Assistant, a hyperlocal delivery chatbot.
We carry:
- Maggi Noodles (Sharma Kirana has stock, Quick Mart is OOS).
- Amul Butter (Sharma Kirana: ₹48, Quick Mart: ₹46, Super Save: ₹47).
- Coca-Cola (all stores carry it, Sharma is closest).
- Aashirvaad Atta (Sharma: ₹210, Super Save: ₹198).
- Bourbon Biscuits.

Our features:
- Customer Portal: browsing, favorites, time-scheduled slots, receipts, one-tap reorders.
- Retailer Portal: Sharma Kirana order acceptance & packing dashboard.
- Delivery Portal: rider earnings, available runs, live map navigation.
- Admin Panel: reset data, see charts and stock lists.

Customer support guidelines:
- Delayed orders: tell them to check the tracking map under "My Orders".
- Cancellations/Refunds: can cancel prior to store acceptance. Restores stock instantly. Refund takes 2-3 days.
- Payments: simulated right now, UPI/cards/Razorpay in next release.

Respond concisely in 1-3 sentences. Do not mention system details unless asked.
User query: ${textToSend.trim()}`
                }]
              }]
            })
          }
        );

        const data = await response.json();
        botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received. Please check your internet connection or Gemini API key.";
      } else {
        // Fallback: Run rule-based heuristic parser locally
        await new Promise((res) => setTimeout(res, 500));
        botResponse = getHeuristicResponse(textToSend.trim());
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: 'bot',
          timestamp: Date.now(),
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I couldn't contact the support engine. Please verify your connection or your Gemini key.",
          sender: 'bot',
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>NearFind</Text>
            <Text style={styles.headerSubtitle}>Hyperlocal Helper & Slider</Text>
          </View>
          <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        
        {/* Dynamic Image Carousel Slider */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={SLIDER_DATA}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={styles.slideCard}>
                <Image source={item.image} style={styles.slideImage} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.slideGradient}
                >
                  <Text style={styles.slideTitle}>{item.title}</Text>
                  <Text style={styles.slideDescription}>{item.description}</Text>
                </LinearGradient>
              </View>
            )}
          />
          {/* Slider Dots */}
          <View style={styles.dotsRow}>
            {SLIDER_DATA.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  activeSlide === idx ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Call to Action Grid */}
        <View style={styles.quickNavContainer}>
          <Text style={styles.sectionTitle}>Shop Now</Text>
          <View style={styles.quickNavGrid}>
            <TouchableOpacity
              style={[styles.quickNavCard, { borderLeftColor: '#16a34a' }]}
              onPress={() => selectRole('customer')}
            >
              <View style={[styles.quickNavIconBg, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="cart" size={20} color="#16a34a" />
              </View>
              <Text style={styles.quickNavLabel}>Start Shopping</Text>
              <Text style={styles.quickNavDesc}>Browse nearby Kirana store catalogs and place optimized orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Chatbot Module */}
        <View style={styles.chatSection}>
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderLeft}>
              <View style={styles.chatLogoBg}>
                <Ionicons name="chatbubbles" size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.chatTitle}>NearFind Local AI</Text>
                <Text style={styles.chatSubtitle}>Instant stock & price checker</Text>
              </View>
            </View>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatLogs}
            contentContainerStyle={styles.chatLogsContent}
            nestedScrollEnabled
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubbleContainer,
                    isUser ? styles.messageUserContainer : styles.messageBotContainer,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.messageUserBubble : styles.messageBotBubble,
                    ]}
                  >
                    <Text style={[styles.messageText, isUser && styles.messageUserText]}>
                      {m.text}
                    </Text>
                  </View>
                </View>
              );
            })}
            
            {isLoading && (
              <View style={styles.loadingBubbleContainer}>
                <ActivityIndicator size="small" color="#16a34a" style={{ marginRight: 8 }} />
                <Text style={styles.loadingText}>Searching stores...</Text>
              </View>
            )}
          </ScrollView>

          {/* Quick Actions Grid */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsHeading}>Ask a Support Question:</Text>
            <View style={styles.quickActionsGrid}>
              {CHAT_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q.id}
                  style={styles.actionCard}
                  onPress={() => handleSendMessage(q.query)}
                  disabled={isLoading}
                >
                  <Ionicons name={q.icon} size={15} color="#16a34a" style={{ marginRight: 6 }} />
                  <Text style={styles.actionText} numberOfLines={1}>
                    {q.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dcfce7',
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  
  // Slider / Carousel styles
  sliderContainer: {
    marginVertical: 16,
    width: width,
    height: 200,
    alignItems: 'center',
    position: 'relative',
  },
  slideCard: {
    width: width - 32,
    marginHorizontal: 16,
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    padding: 16,
    justifyContent: 'flex-end',
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  slideDescription: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
    lineHeight: 16,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 14,
    backgroundColor: '#ffffff',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // CTA Grid Layout
  quickNavContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickNavGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickNavCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 2,
  },
  quickNavIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickNavLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  quickNavDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },

  // AI Chatbot Styles
  chatSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 3,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fafafa',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatLogoBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  chatSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  chatLogs: {
    height: 250,
    backgroundColor: '#f8fafc',
  },
  chatLogsContent: {
    padding: 12,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  messageUserContainer: {
    justifyContent: 'flex-end',
  },
  messageBotContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  messageUserBubble: {
    backgroundColor: '#16a34a',
    borderBottomRightRadius: 4,
  },
  messageBotBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  messageUserText: {
    color: '#ffffff',
  },
  loadingBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  
  // Support Actions Grid styles
  quickActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 14,
    backgroundColor: '#ffffff',
  },
  quickActionsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (width - 32 - 28 - 8) / 2,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
});
