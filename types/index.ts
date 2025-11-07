// Database Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: string;
}

export interface WhatsAppConnection {
  id: string;
  user_id: string;
  phone_number: string | null;
  is_connected: boolean;
  session_data: Record<string, any> | null;
  last_connected: string | null;
  created_at: string;
}

export interface BotConfig {
  id: string;
  user_id: string;
  main_context: string;
  business_info: BusinessInfo;
  openai_model: string;
  openai_api_key: string | null;
  temperature: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessInfo {
  name: string;
  hours: string;
  address: string;
  phone: string;
}

export interface MiniTask {
  id: string;
  bot_config_id: string;
  trigger_keyword: string;
  response_text: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface ChatMetrics {
  id: string;
  user_id: string;
  date: string;
  total_chats: number;
  daily_chats: number;
  bot_responses: number;
  created_at: string;
}

export interface MessageLog {
  id: string;
  user_id: string;
  chat_id: string;
  sender_number: string;
  message_text: string;
  bot_response: string | null;
  was_automated: boolean;
  timestamp: string;
}

// Component Props Types
export interface MetricsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
}

export interface QRDisplayProps {
  qrCode: string | null;
  isConnected: boolean;
  phoneNumber?: string;
}

export interface BotConfigFormData {
  mainContext: string;
  businessInfo: BusinessInfo;
  openai: {
    model: string;
    apiKey: string;
    temperature: number;
  };
}

export interface MiniTaskFormData {
  triggerKeyword: string;
  responseText: string;
  priority: number;
  isActive: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface QRCodeResponse {
  qrCode: string;
  sessionId: string;
}

export interface ConnectionStatusResponse {
  isConnected: boolean;
  phoneNumber?: string;
  lastConnected?: string;
}

export interface MetricsResponse {
  totalChats: number;
  dailyChats: number;
  botResponses: number;
}
