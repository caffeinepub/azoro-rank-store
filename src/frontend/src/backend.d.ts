import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface Rank {
    name: string;
    color: string;
    tier: bigint;
    seasonalPrice: bigint;
    sevenDayPrice: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Order {
    id: bigint;
    rankName: string;
    status: OrderStatusCode;
    duration: Duration;
    owner: Principal;
    createdAt: bigint;
    minecraftUsername: string;
    stripeSessionId: string;
    priceUsd: bigint;
}
export interface UserProfile {
    name: string;
    minecraftUsername?: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum Duration {
    Seasonal = "Seasonal",
    SevenDay = "SevenDay"
}
export enum OrderStatusCode {
    pending = "pending",
    fulfilled = "fulfilled",
    paid = "paid"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimFirstAdmin(): Promise<boolean>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createOrder(minecraftUsername: string, rankName: string, duration: Duration, priceUsd: bigint): Promise<bigint>;
    getAllOrders(): Promise<Array<Order>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrdersByUsername(username: string): Promise<Array<Order>>;
    getRanks(): Promise<Array<Rank>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateOrderStatus(orderId: bigint, newStatus: OrderStatusCode): Promise<boolean>;
}
