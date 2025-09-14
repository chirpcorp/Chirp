export const sidebarLinks = [
  {
    imgURL: "/assets/home.svg",
    route: "/",
    label: "Home",
  },
  {
    imgURL: "/assets/search.svg",
    route: "/explore",
    label: "Explore",
  },
  {
    imgURL: "/assets/heart.svg",
    route: "/activity",
    label: "Notifications",
  },
  {
    imgURL: "/assets/create.svg",
    route: "/create-chirp",
    label: "Create Chirp",
  },
  {
    imgURL: "/assets/community.svg",
    route: "/communities",
    label: "Communities",
  },
  {
    imgURL: "/assets/reply.svg",
    route: "/chat",
    label: "Chat",
  },
  {
    imgURL: "/assets/settings.svg",
    route: "/settings",
    label: "Settings",
  },
  {
    imgURL: "/assets/user.svg",
    route: "/profile",
    label: "Profile",
  },
];

export const profileTabs = [
  { value: "chirps", label: "Chirps", icon: "/assets/reply.svg" },
  { value: "replies", label: "Replies", icon: "/assets/members.svg" },
  { value: "tagged", label: "Tagged", icon: "/assets/tag.svg" },
];

export const communityTabs = [
  { value: "chirps", label: "Chirps", icon: "/assets/reply.svg" },
  { value: "members", label: "Members", icon: "/assets/members.svg" },
  { value: "requests", label: "Requests", icon: "/assets/request.svg" },
];
