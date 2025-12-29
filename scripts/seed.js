const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting database seeding...');

    // Create demo users
    const adminResult = await client.query(`
      INSERT INTO users (email, name, phone, role)
      VALUES ('admin@hostbaku.com', 'Admin User', '+994501234567', 'admin')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const adminId = adminResult.rows[0].id;

    const cleanerResult = await client.query(`
      INSERT INTO users (email, name, phone, role)
      VALUES ('cleaner@hostbaku.com', 'Aysel Mammadova', '+994502345678', 'cleaner')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const cleanerId = cleanerResult.rows[0].id;

    const cleaner2Result = await client.query(`
      INSERT INTO users (email, name, phone, role)
      VALUES ('cleaner2@hostbaku.com', 'Nigar Aliyeva', '+994503456789', 'cleaner')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const cleaner2Id = cleaner2Result.rows[0].id;

    const ownerResult = await client.query(`
      INSERT INTO users (email, name, phone, role)
      VALUES ('owner@hostbaku.com', 'Farid Hasanov', '+994504567890', 'owner')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const ownerId = ownerResult.rows[0].id;

    const owner2Result = await client.query(`
      INSERT INTO users (email, name, phone, role)
      VALUES ('owner2@hostbaku.com', 'Leyla Guliyeva', '+994505678901', 'owner')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const owner2Id = owner2Result.rows[0].id;

    // Create demo properties
    const property1Result = await client.query(`
      INSERT INTO properties (name, address, city, description, owner_id, bedrooms, bathrooms, max_guests, airbnb_link)
      VALUES (
        'Flame Towers View Apartment',
        '28 May Street, Building 15, Apt 42',
        'Baku',
        'Luxurious 2-bedroom apartment with stunning views of Flame Towers',
        $1,
        2,
        1,
        4,
        'https://airbnb.com/rooms/12345'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [ownerId]);

    const property2Result = await client.query(`
      INSERT INTO properties (name, address, city, description, owner_id, bedrooms, bathrooms, max_guests, airbnb_link)
      VALUES (
        'Old City Studio',
        'Icheri Sheher, Boyuk Qala Street 8',
        'Baku',
        'Cozy studio in the heart of historic Old City',
        $1,
        1,
        1,
        2,
        'https://airbnb.com/rooms/23456'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [ownerId]);

    const property3Result = await client.query(`
      INSERT INTO properties (name, address, city, description, owner_id, bedrooms, bathrooms, max_guests, airbnb_link)
      VALUES (
        'Boulevard Residence',
        'Neftchilar Avenue 95',
        'Baku',
        'Modern 3-bedroom apartment near Baku Boulevard',
        $1,
        3,
        2,
        6,
        'https://airbnb.com/rooms/34567'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [owner2Id]);

    const property1Id = property1Result.rows[0]?.id;
    const property2Id = property2Result.rows[0]?.id;
    const property3Id = property3Result.rows[0]?.id;

    if (property1Id && property2Id && property3Id) {
      // Assign cleaners to properties
      await client.query(`
        INSERT INTO cleaner_assignments (cleaner_id, property_id, is_primary)
        VALUES ($1, $2, true), ($1, $3, true), ($4, $5, true), ($4, $2, false)
        ON CONFLICT DO NOTHING
      `, [cleanerId, property1Id, property2Id, cleaner2Id, property3Id]);

      // Create demo reservations
      const today = new Date();
      const dates = [
        { checkIn: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), checkOut: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000) },
        { checkIn: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), checkOut: today },
        { checkIn: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), checkOut: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000) },
        { checkIn: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), checkOut: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000) },
      ];

      const reservationResult = await client.query(`
        INSERT INTO reservations (property_id, guest_name, guest_email, check_in, check_out, num_guests, total_amount, platform)
        VALUES 
          ($1, 'John Smith', 'john@example.com', $2, $3, 2, 450.00, 'airbnb'),
          ($1, 'Maria Garcia', 'maria@example.com', $4, $5, 3, 380.00, 'booking'),
          ($1, 'Ahmed Hassan', 'ahmed@example.com', $6, $7, 2, 520.00, 'airbnb'),
          ($8, 'Lisa Chen', 'lisa@example.com', $4, $5, 2, 280.00, 'airbnb')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        property1Id,
        dates[0].checkIn.toISOString().split('T')[0],
        dates[0].checkOut.toISOString().split('T')[0],
        dates[1].checkIn.toISOString().split('T')[0],
        dates[1].checkOut.toISOString().split('T')[0],
        dates[2].checkIn.toISOString().split('T')[0],
        dates[2].checkOut.toISOString().split('T')[0],
        property2Id
      ]);

      // Create demo tasks
      await client.query(`
        INSERT INTO tasks (property_id, assigned_to, created_by, task_type, status, title, description, due_date, checklist)
        VALUES 
          ($1, $2, $3, 'turnover_clean', 'todo', 'Turnover Clean - Flame Towers', 'Standard turnover clean before next guest', $4, $5),
          ($1, $2, $3, 'deep_clean', 'in_progress', 'Monthly Deep Clean', 'Complete deep cleaning including appliances', $6, $5),
          ($7, $8, $3, 'turnover_clean', 'done', 'Turnover Clean - Old City', 'Standard turnover clean', $9, $5),
          ($10, $8, $3, 'inspection', 'todo', 'Quarterly Inspection', 'Check all appliances and fixtures', $4, $11)
        ON CONFLICT DO NOTHING
      `, [
        property1Id,
        cleanerId,
        adminId,
        dates[1].checkOut.toISOString().split('T')[0],
        JSON.stringify([
          { id: '1', text: 'Strip beds and start laundry', checked: false },
          { id: '2', text: 'Clean bathroom thoroughly', checked: false },
          { id: '3', text: 'Vacuum and mop all floors', checked: false },
          { id: '4', text: 'Wipe down kitchen surfaces', checked: false },
          { id: '5', text: 'Restock amenities', checked: false },
          { id: '6', text: 'Make beds with fresh linens', checked: false },
          { id: '7', text: 'Final walkthrough', checked: false },
        ]),
        dates[3].checkIn.toISOString().split('T')[0],
        property2Id,
        cleaner2Id,
        dates[0].checkOut.toISOString().split('T')[0],
        property3Id,
        JSON.stringify([
          { id: '1', text: 'Check all appliances working', checked: false },
          { id: '2', text: 'Test smoke detectors', checked: false },
          { id: '3', text: 'Inspect for any damage', checked: false },
          { id: '4', text: 'Check water pressure', checked: false },
          { id: '5', text: 'Document any issues', checked: false },
        ]),
      ]);

      // Create demo expenses
      await client.query(`
        INSERT INTO expenses (property_id, recorded_by, category, description, amount, expense_date, is_billable)
        VALUES 
          ($1, $2, 'Cleaning Supplies', 'Monthly cleaning supplies restock', 45.00, $3, true),
          ($1, $2, 'Maintenance', 'Fixed leaky faucet in bathroom', 120.00, $3, true),
          ($4, $2, 'Amenities', 'Guest welcome supplies', 35.00, $3, true),
          ($5, $2, 'Utilities', 'Water bill - June', 28.00, $3, false)
        ON CONFLICT DO NOTHING
      `, [
        property1Id,
        adminId,
        today.toISOString().split('T')[0],
        property2Id,
        property3Id
      ]);

      // Create demo maintenance ticket
      await client.query(`
        INSERT INTO maintenance_tickets (property_id, reported_by, title, description, priority, status)
        VALUES ($1, $2, 'AC not cooling properly', 'Guest reported AC is running but not cooling. Needs technician visit.', 2, 'open')
        ON CONFLICT DO NOTHING
      `, [property1Id, cleanerId]);

      // Create demo leads
      await client.query(`
        INSERT INTO leads (contact_name, contact_email, contact_phone, location, layout, property_link, num_bedrooms, num_bathrooms, status, notes)
        VALUES 
          ('Kamran Aliyev', 'kamran@example.com', '+994507891234', 'Nasimi District, near Ganjlik Mall', '2BR apartment', 'https://bina.az/items/123456', 2, 1, 'new', 'Interested in property management services'),
          ('Sevda Mammadova', 'sevda@example.com', '+994508912345', 'Yasamal District', '1BR studio', NULL, 1, 1, 'contacted', 'Called back, scheduled viewing for next week'),
          ('Rashad Huseynov', 'rashad@example.com', '+994509123456', 'Sahil, Sea Breeze Resort', '3BR luxury apartment', 'https://airbnb.com/rooms/999999', 3, 2, 'qualified', 'High-end property, owner interested in premium management')
        ON CONFLICT DO NOTHING
      `);
    }

    console.log('Seeding completed successfully!');
    console.log('');
    console.log('Demo accounts created:');
    console.log('  Admin: admin@hostbaku.com');
    console.log('  Cleaner: cleaner@hostbaku.com');
    console.log('  Cleaner 2: cleaner2@hostbaku.com');
    console.log('  Owner: owner@hostbaku.com');
    console.log('  Owner 2: owner2@hostbaku.com');
    console.log('');
    console.log('Use OTP login - any 6-digit code will work in development mode.');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
