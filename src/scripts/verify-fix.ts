
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('1. Verifying SilentReadingEvent (camelCase in Type, but maybe snake_case in DB? Querying to see...)');
    // Note: The previous error "column ... does not exist" when we used snake_case for Event implied it IS camelCase or we used the wrong one.
    // Wait, the error for PAGE load was: "column SilentReadingEvent.is_active does not exist". 
    // This implies the code was asking for `is_active` but the DB has `isActive` (or vice versa?).
    // The hint "Perhaps you meant ... isActive" means the DB has `isActive`.

    // So for Event, it IS camelCase columns in DB (unusual for Postgres but possible if created with quotes).

    const { data: events, error: eventError } = await supabase
        .from('SilentReadingEvent')
        .select('*')
        .limit(1);

    if (eventError) {
        console.error('Event Select Error:', JSON.stringify(eventError, null, 2));
        return;
    }
    console.log('Event Data Sample:', JSON.stringify(events[0], null, 2));

    if (events.length === 0) {
        console.log('No events found to test join.');
        return;
    }

    const eventId = events[0].id; // Should be 'id'

    console.log('\n2. Verifying User...');
    const { data: users, error: userError } = await supabase
        .from('User')
        .select('id')
        .limit(1);

    if (userError || !users.length) {
        console.error('User Select Error or No User:', userError);
        return;
    }

    const userId = users[0].id;
    console.log(`Testing with Event ID: ${eventId}, User ID: ${userId}`);

    console.log('\n3. Verifying SilentReadingParticipant INSERT (snake_case columns: event_id, user_id)...');

    // We expect this to WORK now that we switched to snake_case
    const { error: insertError } = await supabase
        .from('SilentReadingParticipant')
        .insert({
            event_id: eventId,
            user_id: userId
        });

    if (insertError) {
        // If it's a duplicate key error, that's fine, it means the column names were correct!
        if (insertError.code === '23505') {
            console.log('SUCCESS: Duplicate key error means columns exist and unique constraint was hit.');
        } else {
            console.error('Insert Error:', JSON.stringify(insertError, null, 2));
        }
    } else {
        console.log('SUCCESS: Insert successful!');

        // Cleanup
        console.log('Cleaning up test data...');
        await supabase.from('SilentReadingParticipant').delete().match({ event_id: eventId, user_id: userId });
    }
}

verify();
