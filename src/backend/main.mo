import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  public type Rank = {
    name : Text;
    color : Text;
    tier : Nat;
    sevenDayPrice : Nat;
    seasonalPrice : Nat;
  };

  public type Duration = {
    #SevenDay;
    #Seasonal;
  };

  public type OrderStatusCode = {
    #pending;
    #paid;
    #fulfilled;
  };

  public type Order = {
    id : Nat;
    minecraftUsername : Text;
    rankName : Text;
    duration : Duration;
    priceUsd : Nat;
    status : OrderStatusCode;
    createdAt : Int;
    stripeSessionId : Text;
    owner : Principal;
  };

  public type UserProfile = {
    name : Text;
    minecraftUsername : ?Text;
  };

  // Access control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent state
  var nextOrderId = 1;
  let orders = Map.empty<Nat, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var adminClaimed = false;

  // Ranks catalog
  let ranks : [Rank] = [
    {
      name = "SEAMON";
      color = "#F97316";
      tier = 1;
      sevenDayPrice = 15;
      seasonalPrice = 70;
    },
    {
      name = "SEAMON+";
      color = "#22C55E";
      tier = 2;
      sevenDayPrice = 35;
      seasonalPrice = 100;
    },
    {
      name = "MONARCH";
      color = "#A855F7";
      tier = 3;
      sevenDayPrice = 90;
      seasonalPrice = 200;
    },
    {
      name = "CAPTAIN";
      color = "#3B82F6";
      tier = 4;
      sevenDayPrice = 150;
      seasonalPrice = 300;
    },
    {
      name = "CAPTAIN+";
      color = "#EF4444";
      tier = 5;
      sevenDayPrice = 200;
      seasonalPrice = 450;
    },
    {
      name = "CUSTOM RANK";
      color = "#EAB308";
      tier = 6;
      sevenDayPrice = 250;
      seasonalPrice = 600;
    },
  ];

  // Stripe config
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // User Profile API
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Rank Shop API
  public query ({ caller }) func getRanks() : async [Rank] {
    ranks;
  };

  public query ({ caller }) func getOrdersByUsername(username : Text) : async [Order] {
    let userOrders = orders.values().toArray().filter(
      func(o) {
        Text.equal(o.minecraftUsername, username);
      }
    );

    if (userOrders.size() > 0) {
      let isOwner = userOrders.find(func(o) { o.owner == caller }) != null;
      let isAdmin = AccessControl.isAdmin(accessControlState, caller);

      if (not isOwner and not isAdmin) {
        Runtime.trap("Unauthorized: Can only view your own orders");
      };
    };

    userOrders;
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set Stripe config");
    };
    stripeConfig := ?config;
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  // Open to anyone - no auth check needed for checkout
  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  // Open to anyone - no auth check needed for session status
  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Claim first admin - first logged-in user to call this becomes admin, no token needed
  public shared ({ caller }) func claimFirstAdmin() : async Bool {
    if (adminClaimed) { return false };
    if (caller.isAnonymous()) { return false };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    adminClaimed := true;
    true;
  };
};
