// ROI Brain System Testing Script
// Run this in browser console on the app to test with real Supabase client

async function testROIBrainSystem() {
  console.log('🧠 Starting ROI Brain System Testing...');
  
  // Test data
  const dentalTest = {
    "vertical": "dental",
    "answers": {
      "dental_chairs_active_choice": "3_4",
      "call_team_members_choice": "2_3",
      "practice_management_software_choice": "dentrix", 
      "website_scheduling_connection_choice": "partial",
      "weekly_appointments_count_choice": "71_120",
      "chair_utilization_pct_choice": "60_80",
      "avg_fee_standard_treatment_usd": 150,
      "daily_incoming_calls_choice": "51_100",
      "daily_unanswered_calls_choice": "4_10",
      "weekly_no_shows_choice": "4_6"
    },
    "scoreSummary": {
      "overall": 65,
      "sections": [
        {"name": "practice_profile", "score": 70},
        {"name": "call_handling_conversion", "score": 55}
      ]
    },
    "moneylost": {
      "total_estimated_monthly": 8500,
      "areas": [
        {
          "area": "Missed Calls",
          "estimate_monthly": 3200,
          "confidence": 85
        }
      ]
    },
    "sessionId": "test-dental-" + Date.now()
  };

  const hvacTest = {
    "vertical": "hvac",
    "answers": {
      "field_technicians_count_choice": "3_5",
      "scheduling_software_used_choice": "servicetitan",
      "hvac_daily_calls_received_choice": "10_20", 
      "hvac_daily_unanswered_calls_choice": "1_3",
      "basic_service_call_fee_usd": 185,
      "monthly_jobs_completed": 120
    },
    "scoreSummary": {
      "overall": 58,
      "sections": [
        {"name": "company_overview", "score": 65},
        {"name": "call_handling_scheduling", "score": 50}
      ]
    },
    "moneylost": {
      "total_estimated_monthly": 12800,
      "areas": [
        {
          "area": "Missed Calls", 
          "estimate_monthly": 4200,
          "confidence": 88
        }
      ]
    },
    "sessionId": "test-hvac-" + Date.now()
  };

  // Test 1: Dental ROI Brain Call
  console.log('📊 Test 1: Dental ROI Brain Call');
  const start1 = Date.now();
  
  try {
    const { data: dentalResult, error: dentalError } = await window.supabase.functions.invoke('ai_roi_brain', {
      body: dentalTest
    });
    
    const time1 = Date.now() - start1;
    console.log(`✅ Dental test completed in ${time1}ms`);
    console.log('📄 Result:', dentalResult);
    
    if (dentalError) {
      console.error('❌ Dental Error:', dentalError);
    }
  } catch (error) {
    console.error('💥 Dental Exception:', error);
  }

  // Test 2: HVAC ROI Brain Call  
  console.log('\n🏠 Test 2: HVAC ROI Brain Call');
  const start2 = Date.now();
  
  try {
    const { data: hvacResult, error: hvacError } = await window.supabase.functions.invoke('ai_roi_brain', {
      body: hvacTest
    });
    
    const time2 = Date.now() - start2;
    console.log(`✅ HVAC test completed in ${time2}ms`);
    console.log('📄 Result:', hvacResult);
    
    if (hvacError) {
      console.error('❌ HVAC Error:', hvacError);
    }
  } catch (error) {
    console.error('💥 HVAC Exception:', error);
  }

  // Test 3: Cache Hit Test (repeat dental call)
  console.log('\n🎯 Test 3: Cache Hit Test (Repeat Dental)');
  const start3 = Date.now();
  
  try {
    const { data: cacheResult, error: cacheError } = await window.supabase.functions.invoke('ai_roi_brain', {
      body: dentalTest // Same data should hit cache
    });
    
    const time3 = Date.now() - start3;
    console.log(`✅ Cache test completed in ${time3}ms`);
    console.log('📄 Cache Result:', cacheResult);
    
    if (time3 < 1000) {
      console.log('🚀 CACHE HIT! Fast response indicates cached result');
    } else {
      console.log('⏳ Possible cache miss or new computation');
    }
    
    if (cacheError) {
      console.error('❌ Cache Error:', cacheError);
    }
  } catch (error) {
    console.error('💥 Cache Exception:', error);
  }

  // Test 4: Check Cache Status
  console.log('\n💾 Test 4: Cache Status Check');
  try {
    const { data: cacheData, error: cacheDbError } = await window.supabase
      .from('roi_brain_cache')
      .select('cache_key, created_at, processing_time, access_count, business_context')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (cacheDbError) {
      console.error('❌ Cache Query Error:', cacheDbError);
    } else {
      console.log('📊 Cache Entries:', cacheData);
      console.log(`💡 Total entries in cache: ${cacheData.length}`);
    }
  } catch (error) {
    console.error('💥 Cache Query Exception:', error);
  }

  console.log('\n🏁 ROI Brain System Testing Complete!');
}

// Auto-run if supabase is available
if (typeof window !== 'undefined' && window.supabase) {
  testROIBrainSystem();
} else {
  console.log('⚠️  Supabase client not available. Run this in browser console on the app.');
}