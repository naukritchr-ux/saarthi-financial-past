const db = require("../config/database");


// ======================================================
// GET ALL LEDGER RECORDS
// ======================================================

async function getLedgerRecords(req, res) {

  try {

    const [rows] = await db.query(`
      SELECT
        id,

        company_name,
        tann,
        tds,
        client_status,

        bd_member,
        team_leader,
        franchise_name,

        industry,
        sub_industry,
        city,

        gst_number,
        no_of_employees,

        date_client_acquired,
        date_of_allocation,
        date_of_reallocation,

        placement_fees,
        salary_from,
        salary_offered,

        date_of_joining,

        bill_date,
        bill_number,

        service_charges,
        total_bill_amount,

        date_received,
        amount_received,

        franchisee_share,

        paid_on_date,

        soa_no,
        info,
        position_name,

        acquired_year,
        allotment_year,
        joining_year,
        bill_year,
        received_year,
        paid_year,

        created_at,
        updated_at

      FROM ledger_records

      ORDER BY id ASC
    `);


    return res.status(200).json({

      success: true,

      count: rows.length,

      data: rows

    });


  } catch (error) {

    console.error(
      "GET LEDGER RECORDS ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message: "Failed to fetch ledger records",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined

    });

  }

}


// ======================================================
// GET SINGLE LEDGER RECORD
// ======================================================

async function getLedgerRecordById(req, res) {

  try {

    const { id } = req.params;


    const [rows] = await db.query(
      `
        SELECT
          id,

          company_name,
          tann,
          tds,
          client_status,

          bd_member,
          team_leader,
          franchise_name,

          industry,
          sub_industry,
          city,

          gst_number,
          no_of_employees,

          date_client_acquired,
          date_of_allocation,
          date_of_reallocation,

          placement_fees,
          salary_from,
          salary_offered,

          date_of_joining,

          bill_date,
          bill_number,

          service_charges,
          total_bill_amount,

          date_received,
          amount_received,

          franchisee_share,

          paid_on_date,

          soa_no,
          info,
          position_name,

          acquired_year,
          allotment_year,
          joining_year,
          bill_year,
          received_year,
          paid_year,

          created_at,
          updated_at

        FROM ledger_records

        WHERE id = ?
      `,
      [id]
    );


    if (rows.length === 0) {

      return res.status(404).json({

        success: false,

        message: "Ledger record not found"

      });

    }


    return res.status(200).json({

      success: true,

      data: rows[0]

    });


  } catch (error) {

    console.error(
      "GET LEDGER RECORD ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message: "Failed to fetch ledger record",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined

    });

  }

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  getLedgerRecords,

  getLedgerRecordById

};