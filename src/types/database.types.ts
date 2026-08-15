export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Role = 'admin' | 'staff' | 'client';
export type MembershipStatus = 'active' | 'expired' | 'pending';
export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type ProductCategory = 'portion' | 'beverage' | 'snack' | 'supplement' | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          photo_url: string | null;
          role: Role;
          qr_code_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          photo_url?: string | null;
          role?: Role;
          qr_code_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          photo_url?: string | null;
          role?: Role;
          qr_code_id?: string;
          created_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          membership_type_id: string | null;
          start_date: string;
          end_date: string;
          amount_paid: number;
          payment_method: PaymentMethod;
          status: MembershipStatus;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: ProductCategory;
          price: number;
          stock: number;
          unit_type: string;
          created_at: string;
        };
      };
    };
  };
}