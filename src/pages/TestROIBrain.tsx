import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Loader2, CheckCircle, XCircle, Clock, Database } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  data?: any;
  error?: string;
}

export default function TestROIBrain() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Dental ROI Brain Call', status: 'pending' },
    { name: 'HVAC ROI Brain Call', status: 'pending' },
    { name: 'Cache Hit Test', status: 'pending' },
    { name: 'Cache Status Check', status: 'pending' }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runTests = async () => {
    setIsRunning(true);
    logger.event('roi_brain_testing_started');

    // Test data
    const dentalTest = {
      vertical: "dental",
      answers: {
        dental_chairs_active_choice: "3_4",
        call_team_members_choice: "2_3", 
        practice_management_software_choice: "dentrix",
        website_scheduling_connection_choice: "partial",
        weekly_appointments_count_choice: "71_120",
        chair_utilization_pct_choice: "60_80",
        avg_fee_standard_treatment_usd: 150,
        daily_incoming_calls_choice: "51_100",
        daily_unanswered_calls_choice: "4_10",
        weekly_no_shows_choice: "4_6"
      },
      scoreSummary: {
        overall: 65,
        sections: [
          { name: "practice_profile", score: 70 },
          { name: "call_handling_conversion", score: 55 }
        ]
      },
      moneylost: {
        total_estimated_monthly: 8500,
        areas: [{
          area: "Missed Calls",
          estimate_monthly: 3200,
          confidence: 85
        }]
      },
      sessionId: "test-dental-" + Date.now()
    };

    const hvacTest = {
      vertical: "hvac", 
      answers: {
        field_technicians_count_choice: "3_5",
        scheduling_software_used_choice: "servicetitan",
        hvac_daily_calls_received_choice: "10_20",
        hvac_daily_unanswered_calls_choice: "1_3",
        basic_service_call_fee_usd: 185,
        monthly_jobs_completed: 120
      },
      scoreSummary: {
        overall: 58,
        sections: [
          { name: "company_overview", score: 65 },
          { name: "call_handling_scheduling", score: 50 }
        ]
      },
      moneylost: {
        total_estimated_monthly: 12800,
        areas: [{
          area: "Missed Calls",
          estimate_monthly: 4200,
          confidence: 88
        }]
      },
      sessionId: "test-hvac-" + Date.now()
    };

    try {
      // Test 1: Dental ROI Brain Call
      updateTest(0, { status: 'running' });
      const start1 = Date.now();
      
      const { data: dentalResult, error: dentalError } = await supabase.functions.invoke('ai_roi_brain', {
        body: dentalTest
      });
      
      const time1 = Date.now() - start1;
      
      if (dentalError) {
        updateTest(0, { status: 'error', duration: time1, error: dentalError.message });
      } else {
        updateTest(0, { status: 'success', duration: time1, data: dentalResult });
        logger.event('dental_test_success', { duration: time1 });
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause

      // Test 2: HVAC ROI Brain Call  
      updateTest(1, { status: 'running' });
      const start2 = Date.now();
      
      const { data: hvacResult, error: hvacError } = await supabase.functions.invoke('ai_roi_brain', {
        body: hvacTest
      });
      
      const time2 = Date.now() - start2;
      
      if (hvacError) {
        updateTest(1, { status: 'error', duration: time2, error: hvacError.message });
      } else {
        updateTest(1, { status: 'success', duration: time2, data: hvacResult });
        logger.event('hvac_test_success', { duration: time2 });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 3: Cache Hit Test (repeat dental call)
      updateTest(2, { status: 'running' });
      const start3 = Date.now();
      
      const { data: cacheResult, error: cacheError } = await supabase.functions.invoke('ai_roi_brain', {
        body: dentalTest // Same data should hit cache
      });
      
      const time3 = Date.now() - start3;
      
      if (cacheError) {
        updateTest(2, { status: 'error', duration: time3, error: cacheError.message });
      } else {
        const isCacheHit = time3 < 2000; // Fast response indicates cache hit
        updateTest(2, { 
          status: 'success', 
          duration: time3, 
          data: { 
            ...cacheResult, 
            _cacheHit: isCacheHit,
            _note: isCacheHit ? 'CACHE HIT! Fast response' : 'Possible cache miss or new computation'
          }
        });
        logger.event('cache_test_success', { duration: time3, cacheHit: isCacheHit });
      }

      // Test 4: Check Cache Status
      updateTest(3, { status: 'running' });
      const start4 = Date.now();
      
      const { data: cacheData, error: cacheDbError } = await supabase
        .from('roi_brain_cache')
        .select('cache_key, created_at, processing_time, access_count, business_context')
        .order('created_at', { ascending: false })
        .limit(5);
      
      const time4 = Date.now() - start4;
      
      if (cacheDbError) {
        updateTest(3, { status: 'error', duration: time4, error: cacheDbError.message });
      } else {
        updateTest(3, { 
          status: 'success', 
          duration: time4, 
          data: { 
            entries: cacheData, 
            count: cacheData?.length || 0,
            _note: `Found ${cacheData?.length || 0} cache entries`
          }
        });
        logger.event('cache_status_success', { entryCount: cacheData?.length || 0 });
      }

    } catch (error: any) {
      logger.error('Test suite error', { error: error.message });
    } finally {
      setIsRunning(false);
      logger.event('roi_brain_testing_completed');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            ROI Brain System Testing
          </CardTitle>
          <CardDescription>
            Testing sistematico del sistema VoiceFit con ROI Brain + Claude Orchestrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isRunning ? 'Running Tests...' : 'Start Testing Suite'}
          </Button>

          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={test.status === 'success' ? 'default' : test.status === 'error' ? 'destructive' : 'secondary'}>
                      {test.status}
                    </Badge>
                    {test.duration && (
                      <Badge variant="outline" className="text-xs">
                        {test.duration}ms
                      </Badge>
                    )}
                  </div>
                </div>
                
                {test.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Error: {test.error}
                  </div>
                )}
                
                {test.data && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600">View Result Data</summary>
                    <pre className="bg-gray-50 p-2 rounded mt-2 overflow-auto text-xs">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}