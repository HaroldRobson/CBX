import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json();

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Valid emails array is required' },
        { status: 400 }
      );
    }

    // Validate all emails
    const validEmails = emails.filter(email => email && isValidEmail(email));
    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses provided' },
        { status: 400 }
      );
    }

    // Get environment variables
    const {
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEET_ID,
    } = process.env;

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

    // Clean the service account email and sheet ID (remove quotes)
    const cleanEmail = GOOGLE_SERVICE_ACCOUNT_EMAIL.replace(/^["']|["']$/g, '');
    const cleanSheetId = GOOGLE_SHEET_ID.replace(/^["']|["']$/g, '');

    // Create Google Sheets client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: cleanEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Check for existing emails
    console.log('Checking for existing emails in batch operation...');
    
    let existingEmails: string[] = [];
    try {
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId: cleanSheetId,
        range: 'Sheet1!A:A', // Get all emails from column A
      });

      existingEmails = existingData.data.values 
        ? existingData.data.values.flat().map(email => email.toLowerCase().trim())
        : [];
    } catch (readError) {
      console.log('Could not read existing emails (sheet might be empty), proceeding with insertion');
    }

    // Filter out emails that already exist
    const newEmails = validEmails.filter(email => 
      !existingEmails.includes(email.toLowerCase().trim())
    );

    // If no new emails to add, return success
    if (newEmails.length === 0) {
      console.log('All emails already exist, no new emails to add');
      return NextResponse.json(
        { 
          message: `${validEmails.length} emails successfully added to waitlist`,
          processed: validEmails.length,
          skipped: emails.length - validEmails.length,
          newEmails: 0,
          duplicates: validEmails.length
        },
        { status: 200 }
      );
    }

    // Get current timestamp
    const timestamp = new Date().toISOString();

    // Prepare batch data with only new emails
    const values = newEmails.map(email => [email, timestamp]);

    // Batch append to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: cleanSheetId,
      range: 'Sheet1!A:B',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return NextResponse.json(
      { 
        message: `${newEmails.length} new emails successfully added to waitlist`,
        processed: newEmails.length,
        skipped: emails.length - validEmails.length,
        duplicates: validEmails.length - newEmails.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error adding emails to waitlist:', error);
    
    let errorMessage = 'Failed to add emails to waitlist';
    
    if (error instanceof Error) {
      if (error.message.includes('DECODER routines')) {
        errorMessage = 'Invalid private key format. Please check your GOOGLE_PRIVATE_KEY environment variable.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Make sure the service account has access to the Google Sheet.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Google Sheet not found. Please check your GOOGLE_SHEET_ID.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

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