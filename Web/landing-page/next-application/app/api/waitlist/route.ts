import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Get environment variables
    const {
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEET_ID,
    } = process.env;

    // Debug: Log environment variables (production debugging)
    console.log('Environment check:');
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL exists:', !!GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('GOOGLE_PRIVATE_KEY exists:', !!GOOGLE_PRIVATE_KEY);
    console.log('GOOGLE_SHEET_ID exists:', !!GOOGLE_SHEET_ID);
    console.log('GOOGLE_SHEET_ID value:', GOOGLE_SHEET_ID || 'MISSING');
    console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('GOOGLE_')));

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
      console.error('Missing required environment variables:');
      console.error('GOOGLE_SERVICE_ACCOUNT_EMAIL:', !!GOOGLE_SERVICE_ACCOUNT_EMAIL);
      console.error('GOOGLE_PRIVATE_KEY:', !!GOOGLE_PRIVATE_KEY);
      console.error('GOOGLE_SHEET_ID:', !!GOOGLE_SHEET_ID);
      console.error('GOOGLE_SHEET_ID value:', GOOGLE_SHEET_ID ? `${GOOGLE_SHEET_ID.substring(0, 10)}...` : 'undefined');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Clean and format the private key
    let privateKey = GOOGLE_PRIVATE_KEY;
    
    // Handle different private key formats (development vs production)
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Remove extra quotes if present (common in Vercel env vars)
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    
    // Clean the service account email (remove quotes)
    const cleanEmail = GOOGLE_SERVICE_ACCOUNT_EMAIL.replace(/^["']|["']$/g, '');
    
    // Clean the sheet ID (remove quotes)  
    const cleanSheetId = GOOGLE_SHEET_ID.replace(/^["']|["']$/g, '');
    
    console.log('Cleaned values:');
    console.log('Service Account Email:', cleanEmail);
    console.log('Sheet ID:', cleanSheetId);
    
    // Add proper formatting if it's a raw key without headers
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      // Check if it's a base64 encoded key without headers
      if (privateKey.length > 100 && !privateKey.includes('\n')) {
        // This might be a raw base64 key, try to format it
        console.error('Private key appears to be missing headers. Expected format: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----');
      }
      
      console.error('Private key missing proper headers. Key preview:', privateKey.substring(0, 50) + '...');
      return NextResponse.json(
        { error: 'Invalid private key format. Make sure the key includes -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY----- headers.' },
        { status: 500 }
      );
    }
    
    // Validate the key format
    if (!privateKey.includes('-----END PRIVATE KEY-----')) {
      console.error('Private key missing footer');
      return NextResponse.json(
        { error: 'Invalid private key format. Missing -----END PRIVATE KEY----- footer.' },
        { status: 500 }
      );
    }

    // Create Google Sheets client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: cleanEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Check if email already exists
    console.log('Checking for existing emails...');
    
    try {
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId: cleanSheetId,
        range: 'Sheet1!A:A', // Get all emails from column A
      });

      const existingEmails = existingData.data.values 
        ? existingData.data.values.flat().map(email => email.toLowerCase().trim())
        : [];

      // Check if the email already exists (case-insensitive)
      if (existingEmails.includes(email.toLowerCase().trim())) {
        console.log('Email already exists, skipping insertion:', email);
        // Return success without error - email already in list
        return NextResponse.json(
          { message: 'Email successfully added to waitlist' },
          { status: 200 }
        );
      }
    } catch (readError) {
      console.log('Could not read existing emails (sheet might be empty), proceeding with insertion');
    }

    // Get current timestamp
    const timestamp = new Date().toISOString();

    // Prepare the data to append
    const values = [[email, timestamp]];

    // Debug: Log the sheet ID being used
    console.log('Attempting to append to sheet ID:', cleanSheetId);
    
    // Append to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: cleanSheetId,
      range: 'Sheet1!A:B', // Assumes columns A (email) and B (timestamp)
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return NextResponse.json(
      { message: 'Email successfully added to waitlist' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error adding email to waitlist:', error);
    
    // Get environment variables for error reporting
    const { GOOGLE_SHEET_ID } = process.env;
    
    // Provide more specific error messages
    let errorMessage = 'Failed to add email to waitlist';
    
    if (error instanceof Error) {
      if (error.message.includes('DECODER routines')) {
        errorMessage = 'Invalid private key format. Please check your GOOGLE_PRIVATE_KEY environment variable.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Make sure the service account has access to the Google Sheet.';
      } else if (error.message.includes('not found') || error.message.includes('Requested entity was not found')) {
        errorMessage = `Google Sheet not found. Sheet ID: '${GOOGLE_SHEET_ID || 'undefined'}'. Error details: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 