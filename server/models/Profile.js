const { createClient } = require('@supabase/supabase-js');

// Use environment variables for Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class Profile {
  constructor(data) {
    Object.assign(this, data);
  }

  static async findOne({ userId }) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      // Map Supabase snake_case to JS camelCase to maintain compatibility with existing code
      return new Profile({
        userId: data.id,
        interactions: data.interactions,
        feedbackScore: data.feedback_score,
        preferredTopics: data.preferred_topics,
        recentLearnings: data.recent_learnings,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (err) {
      console.error("Error in Profile.findOne:", err);
      return null;
    }
  }

  static async create({ userId }) {
    try {
      const newProfile = {
        id: userId,
        interactions: 0,
        feedback_score: 88,
        preferred_topics: ["Machine Learning", "Optimization", "Materials Science"],
        recent_learnings: ["Profile initialized via Backend."]
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (error) throw error;

      return new Profile({
        userId: data.id,
        interactions: data.interactions,
        feedbackScore: data.feedback_score,
        preferredTopics: data.preferred_topics,
        recentLearnings: data.recent_learnings,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (err) {
      console.error("Error in Profile.create:", err);
      return null;
    }
  }

  async save() {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          interactions: this.interactions,
          feedback_score: this.feedbackScore,
          preferred_topics: this.preferredTopics,
          recent_learnings: this.recentLearnings,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.userId);

      if (error) throw error;
      return this;
    } catch (err) {
      console.error("Error in Profile.save:", err);
      return this;
    }
  }
}

module.exports = Profile;
