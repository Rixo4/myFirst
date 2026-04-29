const fs = require('fs').promises;
const path = require('path');

const dataFile = path.join(__dirname, '../database.json');

async function readData() {
  try {
    const data = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    // If file doesn't exist, return empty object
    return {};
  }
}

async function writeData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

class Profile {
  constructor(data) {
    Object.assign(this, data);
  }

  static async findOne({ userId }) {
    const data = await readData();
    if (data[userId]) {
      return new Profile(data[userId]);
    }
    return null;
  }

  static async create({ userId }) {
    const data = await readData();
    const newProfile = {
      userId,
      interactions: 0,
      feedbackScore: 88,
      preferredTopics: ["Machine Learning", "Optimization", "Materials Science"],
      recentLearnings: [
        "User prefers technical deep-dives over summaries",
        "High engagement with papers on efficiency",
        "Often explores related hardware implications"
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data[userId] = newProfile;
    await writeData(data);
    return new Profile(newProfile);
  }

  async save() {
    const data = await readData();
    this.updatedAt = new Date().toISOString();
    data[this.userId] = { ...this };
    await writeData(data);
    return this;
  }
}

module.exports = Profile;
