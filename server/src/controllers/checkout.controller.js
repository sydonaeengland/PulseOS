import * as Checkout from '../models/checkout.model.js';
import * as Settings from '../models/settings.model.js';
import { success, error } from '../utils/response.js';
import { log, ACTIONS } from '../services/audit.service.js';

// GET /api/v1/checkout/queue
export const getQueue = async (req, res) => {
  try {
    const queue = await Checkout.getQueue();
    return success(res, { queue });
  } catch (err) {
    console.error('getQueue error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// POST /api/v1/checkout
export const processCheckout = async (req, res) => {
  try {
    const {
      visit_id, payment_type, patient_payment_method,
      total_fee, line_items,
      insurance_provider, insurance_amount_approved,
      insurance_provider_2, insurance_amount_approved_2,
      notes, patient_id,
    } = req.body;

    if (!visit_id || !payment_type || total_fee === undefined || total_fee === null) {
      return error(res, 'visit_id, payment_type, and total_fee are required', 400);
    }
    if (!Array.isArray(line_items)) {
      return error(res, 'line_items must be an array', 400);
    }

    const approvedAmount  = (Number(insurance_amount_approved) || 0) + (Number(insurance_amount_approved_2) || 0);
    const patientBalance  = Number(total_fee) - approvedAmount;

    // Build receipt reference using facility prefix
    const settings = await Settings.get();
    const prefix = settings?.receipt_prefix ?? 'RCT';
    const receipt_reference = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    const checkoutId = await Checkout.create(
      {
        visit_id,
        patient_id:                patient_id ?? null,
        processed_by:              req.user.id,
        payment_type,
        patient_payment_method:    patient_payment_method ?? null,
        insurance_provider:        insurance_provider ?? null,
        insurance_amount_approved: Number(insurance_amount_approved) || 0,
        insurance_provider_2:      insurance_provider_2 ?? null,
        insurance_amount_approved_2: Number(insurance_amount_approved_2) || 0,
        patient_balance:           patientBalance,
        total_fee:                 Number(total_fee),
        receipt_reference,
        notes:                     notes ?? null,
      },
      line_items
    );

    log(req.user.id, ACTIONS.PROCESS_CHECKOUT, 'checkout', checkoutId, req.ip, {
      visit_id, receipt_reference, total_fee,
    }).catch(() => {});

    const checkout = await Checkout.getByVisitId(visit_id);
    return success(res, { checkout }, 201);
  } catch (err) {
    console.error('processCheckout error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// GET /api/v1/checkout/visit/:visitId
export const getByVisit = async (req, res) => {
  try {
    const checkout = await Checkout.getByVisitId(req.params.visitId);
    if (!checkout) return error(res, 'Checkout not found for this visit', 404);
    return success(res, { checkout });
  } catch (err) {
    console.error('getByVisit error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// GET /api/v1/checkout/visit/:visitId/documents
export const getVisitDocuments = async (req, res) => {
  try {
    const docs = await Checkout.getVisitDocuments(req.params.visitId);
    return success(res, { documents: docs });
  } catch (err) {
    console.error('getVisitDocuments error:', err);
    return error(res, 'Something went wrong', 500);
  }
};
