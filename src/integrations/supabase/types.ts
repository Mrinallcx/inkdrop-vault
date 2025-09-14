export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      file_uploads: {
        Row: {
          compression_ratio: number | null
          created_at: string
          file_size: number
          file_type: string
          filename: string
          id: string
          is_compressed: boolean | null
          metadata: Json | null
          original_filename: string
          processing_status: string | null
          public_url: string | null
          storage_path: string
          thumbnail_url: string | null
          updated_at: string
          uploader_id: string
        }
        Insert: {
          compression_ratio?: number | null
          created_at?: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          is_compressed?: boolean | null
          metadata?: Json | null
          original_filename: string
          processing_status?: string | null
          public_url?: string | null
          storage_path: string
          thumbnail_url?: string | null
          updated_at?: string
          uploader_id: string
        }
        Update: {
          compression_ratio?: number | null
          created_at?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          is_compressed?: boolean | null
          metadata?: Json | null
          original_filename?: string
          processing_status?: string | null
          public_url?: string | null
          storage_path?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      minting_transactions: {
        Row: {
          block_number: number | null
          blockchain: string
          confirmation_count: number | null
          created_at: string
          error_message: string | null
          gas_fee: number | null
          gas_limit: number | null
          gas_price: number | null
          id: string
          network: string
          nft_token_id: string
          retry_count: number | null
          status: string | null
          transaction_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_number?: number | null
          blockchain: string
          confirmation_count?: number | null
          created_at?: string
          error_message?: string | null
          gas_fee?: number | null
          gas_limit?: number | null
          gas_price?: number | null
          id?: string
          network: string
          nft_token_id: string
          retry_count?: number | null
          status?: string | null
          transaction_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_number?: number | null
          blockchain?: string
          confirmation_count?: number | null
          created_at?: string
          error_message?: string | null
          gas_fee?: number | null
          gas_limit?: number | null
          gas_price?: number | null
          id?: string
          network?: string
          nft_token_id?: string
          retry_count?: number | null
          status?: string | null
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "minting_transactions_nft_token_id_fkey"
            columns: ["nft_token_id"]
            isOneToOne: false
            referencedRelation: "nft_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minting_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_collections: {
        Row: {
          banner_image_url: string | null
          blockchain: string
          contract_address: string | null
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          discord_url: string | null
          floor_price: number | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          name: string
          symbol: string | null
          total_supply: number | null
          twitter_url: string | null
          updated_at: string
          volume_traded: number | null
          website_url: string | null
        }
        Insert: {
          banner_image_url?: string | null
          blockchain?: string
          contract_address?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          discord_url?: string | null
          floor_price?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          name: string
          symbol?: string | null
          total_supply?: number | null
          twitter_url?: string | null
          updated_at?: string
          volume_traded?: number | null
          website_url?: string | null
        }
        Update: {
          banner_image_url?: string | null
          blockchain?: string
          contract_address?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          discord_url?: string | null
          floor_price?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          name?: string
          symbol?: string | null
          total_supply?: number | null
          twitter_url?: string | null
          updated_at?: string
          volume_traded?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nft_collections_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_tokens: {
        Row: {
          animation_file_id: string | null
          attributes: Json | null
          blockchain: string
          collection_id: string | null
          contract_address: string | null
          created_at: string
          creator_id: string
          current_price: number | null
          description: string | null
          external_url: string | null
          id: string
          image_file_id: string | null
          is_listed: boolean | null
          is_minted: boolean | null
          last_sale_price: number | null
          levels: Json | null
          like_count: number | null
          mint_price: number | null
          name: string
          owner_id: string
          properties: Json | null
          royalty_percentage: number | null
          royalty_recipient: string | null
          stats: Json | null
          token_id: string | null
          token_standard: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          animation_file_id?: string | null
          attributes?: Json | null
          blockchain?: string
          collection_id?: string | null
          contract_address?: string | null
          created_at?: string
          creator_id: string
          current_price?: number | null
          description?: string | null
          external_url?: string | null
          id?: string
          image_file_id?: string | null
          is_listed?: boolean | null
          is_minted?: boolean | null
          last_sale_price?: number | null
          levels?: Json | null
          like_count?: number | null
          mint_price?: number | null
          name: string
          owner_id: string
          properties?: Json | null
          royalty_percentage?: number | null
          royalty_recipient?: string | null
          stats?: Json | null
          token_id?: string | null
          token_standard?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          animation_file_id?: string | null
          attributes?: Json | null
          blockchain?: string
          collection_id?: string | null
          contract_address?: string | null
          created_at?: string
          creator_id?: string
          current_price?: number | null
          description?: string | null
          external_url?: string | null
          id?: string
          image_file_id?: string | null
          is_listed?: boolean | null
          is_minted?: boolean | null
          last_sale_price?: number | null
          levels?: Json | null
          like_count?: number | null
          mint_price?: number | null
          name?: string
          owner_id?: string
          properties?: Json | null
          royalty_percentage?: number | null
          royalty_recipient?: string | null
          stats?: Json | null
          token_id?: string | null
          token_standard?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nft_tokens_animation_file_id_fkey"
            columns: ["animation_file_id"]
            isOneToOne: false
            referencedRelation: "file_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nft_tokens_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "nft_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nft_tokens_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nft_tokens_image_file_id_fkey"
            columns: ["image_file_id"]
            isOneToOne: false
            referencedRelation: "file_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nft_tokens_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_history: {
        Row: {
          block_number: number | null
          chain_id: string
          confirmations: number | null
          contract_address: string | null
          created_at: string
          error_message: string | null
          from_address: string
          gas_limit: string
          gas_price: string | null
          gas_used: string | null
          hash: string
          id: string
          method_name: string | null
          method_params: Json | null
          status: string
          to_address: string
          transaction_type: string
          updated_at: string
          user_address: string
          value: string
        }
        Insert: {
          block_number?: number | null
          chain_id: string
          confirmations?: number | null
          contract_address?: string | null
          created_at?: string
          error_message?: string | null
          from_address: string
          gas_limit: string
          gas_price?: string | null
          gas_used?: string | null
          hash: string
          id?: string
          method_name?: string | null
          method_params?: Json | null
          status?: string
          to_address: string
          transaction_type?: string
          updated_at?: string
          user_address: string
          value?: string
        }
        Update: {
          block_number?: number | null
          chain_id?: string
          confirmations?: number | null
          contract_address?: string | null
          created_at?: string
          error_message?: string | null
          from_address?: string
          gas_limit?: string
          gas_price?: string | null
          gas_used?: string | null
          hash?: string
          id?: string
          method_name?: string | null
          method_params?: Json | null
          status?: string
          to_address?: string
          transaction_type?: string
          updated_at?: string
          user_address?: string
          value?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          network: string | null
          total_collections: number | null
          total_nfts_created: number | null
          total_nfts_owned: number | null
          twitter_handle: string | null
          updated_at: string
          user_id: string | null
          wallet_address: string
          wallet_type: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          network?: string | null
          total_collections?: number | null
          total_nfts_created?: number | null
          total_nfts_owned?: number | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address: string
          wallet_type: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          network?: string | null
          total_collections?: number | null
          total_nfts_created?: number | null
          total_nfts_owned?: number | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
          wallet_type?: string
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_id_by_wallet: {
        Args: { wallet_addr: string }
        Returns: string
      }
      upsert_user_profile: {
        Args: {
          p_network?: string
          p_wallet_address: string
          p_wallet_type: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
