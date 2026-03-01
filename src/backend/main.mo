import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import List "mo:core/List";
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

  public type LoginLogEntry = {
    principal : Principal;
    timestamp : Int;
  };

  public type ActivityAction = {
    #orderDeleted : {
      orderId : Nat;
      minecraftUsername : Text;
      rankName : Text;
      priceInr : Nat;
    };
    #orderStatusChanged : {
      orderId : Nat;
      minecraftUsername : Text;
      rankName : Text;
      oldStatus : OrderStatusCode;
      newStatus : OrderStatusCode;
    };
    #adminLogin;
    #adminRemoved : { removedPrincipal : Principal };
  };

  public type ActivityLogEntry = {
    principal : Principal;
    timestamp : Int;
    action : ActivityAction;
  };

  // Access control
  var accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent state
  var nextOrderId = 1;
  let orders = Map.empty<Nat, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var adminClaimed = false;
  var stripeConfig : ?Stripe.StripeConfiguration = null;
  let loginLog = List.empty<LoginLogEntry>();
  let activityLog = List.empty<ActivityLogEntry>();

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

  // User Profile API
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // No auth check - returns null if not found, as per spec
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Users can only view their own profile, admins can view any profile
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Require authenticated user (not anonymous)
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Rank Shop API
  public query ({ caller }) func getRanks() : async [Rank] {
    // Public endpoint - no auth required
    ranks;
  };

  public query ({ caller }) func getOrdersByUsername(username : Text) : async [Order] {
    // Filter orders by username
    let userOrders = orders.values().toArray().filter(
      func(o) {
        Text.equal(o.minecraftUsername, username);
      }
    );

    // Authorization: only order owners or admins can view orders
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
    // Admin only
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    // Public endpoint - no auth required
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    // Admin only
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
    // Public endpoint - no auth required
    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  // Open to anyone - no auth check needed for session status
  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    // Public endpoint - no auth required
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    // Public endpoint - no auth required
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

  // New function: login with admin code - requires authenticated user
  public shared ({ caller }) func loginWithAdminCode(code : Text) : async Bool {
    // Require authenticated user (not anonymous)
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can become admin");
    };
    if (Text.equal(code, "azoroontop")) {
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      let logEntry : LoginLogEntry = {
        principal = caller;
        timestamp = Time.now();
      };
      loginLog.add(logEntry);
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func createOrder(minecraftUsername : Text, rankName : Text, duration : Duration, priceUsd : Nat) : async Nat {
    // Anonymous-friendly: no auth check required
    // Caller (including anonymous) becomes the owner
    let orderId = nextOrderId;
    nextOrderId += 1;

    let newOrder : Order = {
      id = orderId;
      minecraftUsername;
      rankName;
      duration;
      priceUsd;
      status = #pending;
      createdAt = Time.now();
      stripeSessionId = "";
      owner = caller;
    };

    orders.add(orderId, newOrder);
    orderId;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, newStatus : OrderStatusCode) : async Bool {
    // Admin only
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    switch (orders.get(orderId)) {
      case (null) { false };
      case (?order) {
        let updatedOrder = { order with status = newStatus };
        orders.add(orderId, updatedOrder);
        true;
      };
    };
  };

  // Added function for admin to delete order
  public shared ({ caller }) func deleteOrder(orderId : Nat) : async Bool {
    // Admin only
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete orders");
    };

    let existed = orders.containsKey(orderId);
    orders.remove(orderId);
    existed;
  };

  // New features
  // 1. Get login log (admin only)
  public query ({ caller }) func getLoginLog() : async [LoginLogEntry] {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view login log");
    };
    loginLog.toArray();
  };

  // 2. Get admin list (admin only)
  public query ({ caller }) func getAdminList() : async [Principal] {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view admin list");
    };

    let adminPrincipals = List.empty<Principal>();
    let userRolesIter = accessControlState.userRoles.entries();
    userRolesIter.forEach(
      func((principal, role)) {
        if (role == #admin) {
          adminPrincipals.add(principal);
        };
      }
    );
    adminPrincipals.toArray();
  };

  // 3. Remove admin (must be admin, cannot remove own role)
  public shared ({ caller }) func removeAdmin(target : Principal) : async Bool {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove admin rights");
    };
    // Cannot remove own admin rights
    if (caller == target) {
      Runtime.trap("You cannot remove your own admin rights");
    };

    switch (accessControlState.userRoles.get(target)) {
      case (null) { false };
      case (?role) {
        if (role == #admin) {
          accessControlState.userRoles.add(target, #user);
          return true;
        };
        false;
      };
    };
  };
};
