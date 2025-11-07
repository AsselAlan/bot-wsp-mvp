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
  notification_number: string | null;
  enable_unanswered_notifications: boolean;
  tone: 'formal' | 'casual' | 'friendly';
  use_emojis: 'never' | 'moderate' | 'frequent';
  strict_mode: boolean;
  response_length: 'short' | 'medium' | 'long';
  custom_instructions: string;
  selected_template_id: string | null;
  template_options: Record<string, any>;
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

export interface UnansweredMessage {
  id: string;
  user_id: string;
  chat_id: string;
  sender_number: string;
  message_text: string;
  attempted_response: string | null;
  reason: 'out_of_context' | 'no_match' | 'api_error' | 'paused';
  is_reviewed: boolean;
  created_at: string;
  reviewed_at: string | null;
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

export interface UnansweredMessagesResponse {
  messages: UnansweredMessage[];
  stats: {
    total: number;
    unreviewedCount: number;
    percentageUnanswered: number;
  };
}

export interface UnansweredMessageListProps {
  messages: UnansweredMessage[];
  onMarkReviewed: (id: string) => Promise<void>;
  isLoading?: boolean;
}

// Business Templates Types
export interface BusinessTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  default_main_context: string;
  default_tone: 'formal' | 'casual' | 'friendly';
  default_use_emojis: 'never' | 'moderate' | 'frequent';
  default_response_length: 'short' | 'medium' | 'long';
  default_strict_mode: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateOption {
  id: string;
  template_id: string;
  option_key: string;
  option_label: string;
  option_description: string | null;
  category: string;
  field_type: 'boolean' | 'text' | 'textarea' | 'url' | 'file' | 'select';
  field_options: string[] | null;
  default_value: string | null;
  is_required: boolean;
  display_order: number;
  created_at: string;
}

export interface BusinessDocument {
  id: string;
  user_id: string;
  document_type: 'menu' | 'catalog' | 'faq' | 'other';
  file_name: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  content_text: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Template-related API Response Types
export interface TemplateWithOptions extends BusinessTemplate {
  options: TemplateOption[];
}

export interface TemplateListResponse {
  templates: TemplateWithOptions[];
}

export interface ApplyTemplateRequest {
  template_id: string;
  template_options?: Record<string, any>;
}
