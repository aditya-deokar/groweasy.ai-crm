const fs = require('fs');
const path = require('path');

const headers = [
  'First Name',
  'Last Name',
  'Email Address',
  'Phone Number',
  'Company',
  'Job Title',
  'City',
  'Country',
  'Notes',
  'Lead Status'
];

const rows = [];
rows.push(headers.join(','));

const firstNames = ['John', 'Jane', 'Alex', 'Chris', 'Katie', 'Michael', 'Sarah', 'David', 'Laura', 'Daniel', 'Emma'];
const lastNames = ['Smith', 'Doe', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez'];
const companies = ['Acme Corp', 'Tech Solutions', 'Global Industries', 'Innovate LLC', 'Alpha Tech', 'Beta Corp', 'Omega Group', 'StartUp Inc'];
const titles = ['Manager', 'Developer', 'CEO', 'Director', 'VP', 'Consultant', 'Engineer', 'Analyst'];
const cities = ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Paris', 'Toronto'];
const countries = ['USA', 'UK', 'Germany', 'Japan', 'Australia', 'France', 'Canada'];
const notes = ['Follow up soon.', 'Interested in premium tier.', 'Not interested right now.', 'Call back next week.', 'Requested a demo.', 'Sent pricing details.'];
const statuses = ['HOT', 'COLD', 'WARM', 'New', 'Contacted', 'Qualified', 'Lost'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function messUp(str) {
  if (!str) return '';
  const rand = Math.random();
  if (rand < 0.1) return str.toLowerCase();
  if (rand < 0.2) return str.toUpperCase();
  if (rand < 0.3) return '   ' + str + '  '; // Extra spaces
  if (rand < 0.35) return str.replace('a', '@').replace('e', '3'); // Typos
  if (rand < 0.4) return ''; // Missing data completely
  return str;
}

for (let i = 1; i <= 1000; i++) {
  let firstName = randomItem(firstNames);
  let lastName = randomItem(lastNames);
  let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  
  // Messy Phone Numbers
  let phone = `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const phoneRand = Math.random();
  if (phoneRand < 0.1) {
    phone = `(555) ${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  } else if (phoneRand < 0.2) {
    phone = `555.${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}.${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  } else if (phoneRand < 0.3) {
    phone = 'N/A';
  } else if (phoneRand < 0.35) {
    phone = '';
  } else if (phoneRand < 0.4) {
    phone = `+44 ${String(Math.floor(Math.random() * 1000000000))}`;
  }

  // Messy Emails
  const emailRand = Math.random();
  if (emailRand < 0.1) email = email.replace('@', '(at)');
  if (emailRand < 0.15) email = '';
  if (emailRand < 0.2) email = 'invalid-email.com';
  if (emailRand < 0.25) email = `  ${email}  `;

  let company = randomItem(companies);
  let title = randomItem(titles);
  let city = randomItem(cities);
  let country = randomItem(countries);
  let note = randomItem(notes);
  let status = randomItem(statuses);

  // Apply general messiness (casing, spaces, missing values)
  firstName = messUp(firstName);
  lastName = messUp(lastName);
  company = messUp(company);
  title = messUp(title);
  city = messUp(city);
  country = messUp(country);
  
  // Messy Notes (with internal commas and quotes)
  if (Math.random() < 0.2) {
    note = note + ', also said: "Call me later"';
  } else if (Math.random() < 0.3) {
    note = note + '\nNew line comment.'; // Test newlines in CSV
  }
  
  // Status messiness
  if (Math.random() < 0.2) status = status.toLowerCase();
  if (Math.random() < 0.3 && status) status = ' ' + status + ' ';

  // Add completely broken rows occasionally
  if (Math.random() < 0.05) {
    firstName = 'null';
    lastName = 'undefined';
    email = '---';
    phone = '0000000000';
  }

  // Format row fields with double quotes and escape internal quotes to be CSV safe
  const escapeCsv = (val) => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const row = [
    escapeCsv(firstName),
    escapeCsv(lastName),
    escapeCsv(email),
    escapeCsv(phone),
    escapeCsv(company),
    escapeCsv(title),
    escapeCsv(city),
    escapeCsv(country),
    escapeCsv(note),
    escapeCsv(status)
  ];
  
  rows.push(row.join(','));
}

const outputPath = path.join(__dirname, 'bulk-messy-1000.csv');
fs.writeFileSync(outputPath, rows.join('\n'));
console.log(`Successfully generated ${outputPath} with 1000 messy rows.`);
