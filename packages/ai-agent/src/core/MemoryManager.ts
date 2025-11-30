import { SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export interface UserFact {
    id: string
    category: 'preference' | 'skill' | 'career_goal' | 'constraint' | 'other'
    content: string
    confidence: number
    is_verified: boolean
    source?: string
    created_at: string
}

export interface Memory {
    id: string
    content: string
    similarity?: number
    importance: number
    created_at: string
    metadata?: Record<string, any>
}

export class MemoryManager {
    private supabase: SupabaseClient
    private openai: OpenAI

    constructor(
        supabaseClient: SupabaseClient,
        openaiApiKey: string,
        openaiBaseUrl?: string
    ) {
        this.supabase = supabaseClient
        this.openai = new OpenAI({
            apiKey: openaiApiKey,
            baseURL: openaiBaseUrl,
        })
    }

    /**
     * Add a structured fact about the user
     */
    async addFact(
        userId: string,
        fact: Omit<UserFact, 'id' | 'created_at' | 'is_verified'>
    ): Promise<UserFact> {
        const { data, error } = await this.supabase
            .from('user_facts')
            .insert({
                user_id: userId,
                ...fact,
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Get all facts for a user, optionally filtered by category
     */
    async getFacts(
        userId: string,
        category?: UserFact['category']
    ): Promise<UserFact[]> {
        let query = this.supabase
            .from('user_facts')
            .select('*')
            .eq('user_id', userId)

        if (category) {
            query = query.eq('category', category)
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
    }

    /**
     * Add an episodic memory with vector embedding
     */
    async addMemory(
        userId: string,
        content: string,
        importance: number = 1,
        metadata: Record<string, any> = {}
    ): Promise<Memory> {
        // Generate embedding
        const embedding = await this.generateEmbedding(content)

        const { data, error } = await this.supabase
            .from('memories')
            .insert({
                user_id: userId,
                content,
                embedding,
                importance,
                metadata,
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Search memories by semantic similarity
     */
    async searchMemories(
        userId: string,
        query: string,
        limit: number = 5,
        threshold: number = 0.7
    ): Promise<Memory[]> {
        const embedding = await this.generateEmbedding(query)

        const { data, error } = await this.supabase.rpc('match_memories', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit,
            p_user_id: userId,
        })

        if (error) throw error
        return data || []
    }

    /**
     * Generate embedding for text using OpenAI
     */
    private async generateEmbedding(text: string): Promise<number[]> {
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            encoding_format: 'float',
        })

        return response.data[0].embedding
    }
}
