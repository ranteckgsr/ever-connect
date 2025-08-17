require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');

async function diagnoseSequence() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Diagnosing Sequence Issue\n');
    console.log('=========================\n');

    // Check for triggers
    const triggers = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'users'
    `);
    
    console.log('Triggers on users table:');
    if (triggers.rows.length === 0) {
      console.log('  No triggers found\n');
    } else {
      triggers.rows.forEach(t => {
        console.log(`  - ${t.trigger_name}: ${t.event_manipulation} - ${t.action_statement}`);
      });
    }

    // Check for any functions that might affect sequence
    const functions = await client.query(`
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_definition LIKE '%users_id_seq%'
    `);
    
    console.log('\nFunctions affecting users_id_seq:');
    if (functions.rows.length === 0) {
      console.log('  No functions found\n');
    } else {
      functions.rows.forEach(f => {
        console.log(`  - ${f.routine_name}`);
      });
    }

    // Check sequence details
    const seqDetails = await client.query(`
      SELECT 
        sequence_name,
        data_type,
        numeric_precision,
        numeric_scale,
        start_value,
        minimum_value,
        maximum_value,
        increment,
        cycle_option
      FROM information_schema.sequences
      WHERE sequence_name = 'users_id_seq'
    `);
    
    console.log('\nSequence Details:');
    if (seqDetails.rows.length > 0) {
      const seq = seqDetails.rows[0];
      console.log(`  Name: ${seq.sequence_name}`);
      console.log(`  Data Type: ${seq.data_type}`);
      console.log(`  Start Value: ${seq.start_value}`);
      console.log(`  Increment: ${seq.increment}`);
      console.log(`  Min: ${seq.minimum_value}`);
      console.log(`  Max: ${seq.maximum_value}`);
    }

    // Check current sequence state
    const currentSeq = await client.query(`
      SELECT 
        last_value,
        is_called,
        log_cnt,
        cache_value
      FROM users_id_seq
    `);
    
    console.log('\nCurrent Sequence State:');
    const s = currentSeq.rows[0];
    console.log(`  Last Value: ${s.last_value}`);
    console.log(`  Is Called: ${s.is_called}`);
    console.log(`  Log Count: ${s.log_cnt}`);
    console.log(`  Cache Value: ${s.cache_value}`);
    
    // Theory about the issue
    console.log('\n🔍 Possible Causes:');
    console.log('1. Cache value might be set too high (typically should be 1)');
    console.log('2. Another process or connection pool might be pre-allocating IDs');
    console.log('3. A backup/restore operation might have corrupted the sequence');
    console.log('4. The increment value might be set incorrectly');
    
    if (s.cache_value > 1) {
      console.log(`\n⚠️  WARNING: Cache value is ${s.cache_value}, should typically be 1`);
      console.log('This means PostgreSQL pre-allocates sequence values for performance');
    }
    
    if (parseInt(seq.increment) !== 1) {
      console.log(`\n⚠️  WARNING: Increment is ${seq.increment}, should be 1`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

diagnoseSequence();