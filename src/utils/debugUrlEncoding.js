/**
 * Debug utility for URL encoding issues
 * This helps troubleshoot Firebase Storage URL encoding problems
 */

/**
 * Test URL encoding for a specific problematic URL
 * @param {string} url - The URL to test
 */
export async function testUrlEncoding(url) {
  console.log('🔍 Testing URL encoding for:', url);
  
  try {
    // Test 1: Original URL
    console.log('\n📋 Test 1: Original URL');
    try {
      const response1 = await fetch(url, { method: 'HEAD' });
      console.log(`✅ Original URL works: ${response1.status}`);
    } catch (error) {
      console.log(`❌ Original URL fails: ${error.message}`);
    }
    
    // Test 2: Firebase Storage specific encoding
    console.log('\n📋 Test 2: Firebase Storage encoding');
    if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      
      let objectPath = '';
      if (searchParams.has('o')) {
        objectPath = searchParams.get('o');
        console.log(`📂 Original object path: ${objectPath}`);
        
        // Try different encoding approaches
        const approaches = [
          { name: 'encodeURIComponent', encode: (p) => encodeURIComponent(p) },
          { name: 'double encode', encode: (p) => encodeURIComponent(encodeURIComponent(p)) },
          { name: 'manual encode', encode: (p) => p.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29') }
        ];
        
        for (const approach of approaches) {
          try {
            const encodedPath = approach.encode(objectPath);
            searchParams.set('o', encodedPath);
            const testUrl = urlObj.origin + urlObj.pathname + '?' + searchParams.toString();
            
            console.log(`🔗 Testing ${approach.name}: ${testUrl}`);
            const response = await fetch(testUrl, { method: 'HEAD' });
            console.log(`✅ ${approach.name} works: ${response.status}`);
            
            if (response.ok) {
              console.log(`🎉 Found working encoding: ${approach.name}`);
              return { success: true, method: approach.name, url: testUrl };
            }
          } catch (error) {
            console.log(`❌ ${approach.name} fails: ${error.message}`);
          }
        }
      }
    }
    
    // Test 3: Basic URL encoding
    console.log('\n📋 Test 3: Basic URL encoding');
    try {
      const encodedUrl = encodeURI(url);
      console.log(`🔗 Encoded URL: ${encodedUrl}`);
      const response3 = await fetch(encodedUrl, { method: 'HEAD' });
      console.log(`✅ Basic encoding works: ${response3.status}`);
      if (response3.ok) {
        return { success: true, method: 'basic encodeURI', url: encodedUrl };
      }
    } catch (error) {
      console.log(`❌ Basic encoding fails: ${error.message}`);
    }
    
    // Test 4: Manual character replacement
    console.log('\n📋 Test 4: Manual character replacement');
    try {
      const manualUrl = url
        .replace(/ /g, '%20')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/%/g, '%25');
      console.log(`🔗 Manual URL: ${manualUrl}`);
      const response4 = await fetch(manualUrl, { method: 'HEAD' });
      console.log(`✅ Manual replacement works: ${response4.status}`);
      if (response4.ok) {
        return { success: true, method: 'manual replacement', url: manualUrl };
      }
    } catch (error) {
      console.log(`❌ Manual replacement fails: ${error.message}`);
    }
    
    console.log('\n❌ All encoding methods failed');
    return { success: false, error: 'All encoding methods failed' };
    
  } catch (error) {
    console.error('❌ URL encoding test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test the specific failing URL from the error message
 */
export async function testFailingUrl() {
  const failingUrl = 'https://firebasestorage.googleapis.com/v0/b/bitbybit-photos.appspot.com/o/habit_img%2FbpmJdb5CYKMwl80TNTChEvXChPI3%2Fmade%20by%20iPhone%2F0_image.jpg?alt=media&token=xyz';
  
  console.log('🚨 Testing the specific failing URL from error message');
  return await testUrlEncoding(failingUrl);
}

/**
 * Quick test function that can be run in browser console
 */
export async function quickUrlTest(url) {
  console.log('🔍 Quick URL test');
  const result = await testUrlEncoding(url);
  console.log('📊 Result:', result);
  return result;
}

// Auto-run if in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 URL encoding debug utilities available');
  console.log('Run testFailingUrl() to test the specific failing URL');
  console.log('Run quickUrlTest(yourUrl) to test any URL');
}
