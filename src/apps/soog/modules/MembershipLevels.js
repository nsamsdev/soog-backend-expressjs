export const MembershipLevels = {
  BASIC: {
    cost: 0.0,
    maxProjects: 2,
    maxUsers: 3,
    maxTasks: 5,
    maxFiles: 5,
    supportAllowed: false,
    maxJournals: 10,
    maxFileSize: "2 MB",
    fileSizeInKilobytes: 2000,
    id: 1,
    name: "Free",
    intro: "Try for free",
    description:
      "This subscription is great for trying out our platform. It gives you access to all the features with limitation on amount of use.",
  },
  ESSENTIAL: {
    cost: 14.99,
    maxProjects: 100,
    maxUsers: 10,
    maxTasks: 1000,
    supportAllowed: true,
    maxFiles: 250,
    maxJournals: 1000,
    maxFileSize: "10 MB",
    fileSizeInKilobytes: 10000,
    id: 2,
    name: "Starter",
    intro: "For small teams",
    description:
      "Ideal for small size teams. Giving you the ability to create decent number of projects, tasks, journals and file uploads across the platform.",
  },
  PRO: {
    cost: 24.99,
    maxProjects: 1000,
    maxUsers: 30,
    maxTasks: 10000,
    supportAllowed: true,
    maxFiles: 1000,
    maxJournals: 10000,
    maxFileSize: "100 MB",
    fileSizeInKilobytes: 100000,
    id: 3,
    name: "Pro",
    intro: "Medium to large teams",
    description:
      "Our best subscription yet, it gives you the ability to create up to 1000 projects, 10,000 tasks, 1000 file uploads with increased file size throughout the platform.",
  },
  findById(id) {
    // Use direct reference instead of `this`
    if (id == 1) {
      return this.BASIC;
    }
    if (id == 2) {
      return this.ESSENTIAL;
    }
    if (id == 3) {
      return this.PRO;
    }
  },
  getAll() {
    // Use direct reference
    return [this.BASIC, this.ESSENTIAL, this.PRO];
  },
};
