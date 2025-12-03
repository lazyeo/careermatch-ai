
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: 'apps/web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, title, source_url, description')
        .order('updated_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error('Error fetching job:', error)
        return
    }

    if (jobs && jobs.length > 0) {
        console.log('Latest Job:', JSON.stringify(jobs[0], null, 2))
    } else {
        console.log('No jobs found')
    }
}

main()
