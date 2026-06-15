import * as Settings from '../models/settings.model.js';
import { success, error } from '../utils/response.js';
import { log, ACTIONS } from '../services/audit.service.js';

// GET /api/v1/settings
export const getSettings = async (req, res) => {
  try {
    const [settings, fees] = await Promise.all([
      Settings.get(),
      Settings.getFees(),
    ]);
    return success(res, { settings, fees });
  } catch (err) {
    console.error('getSettings error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/settings
export const updateSettings = async (req, res) => {
  try {
    await Settings.upsert({ ...req.body, updated_by: req.user.id });

    log(req.user.id, ACTIONS.UPDATE_SETTINGS, 'facility_settings', null, req.ip).catch(() => {});

    const settings = await Settings.get();
    return success(res, { settings });
  } catch (err) {
    console.error('updateSettings error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/settings/fees/:visitType
export const updateFee = async (req, res) => {
  try {
    const { visitType } = req.params;
    const { fee_jmd } = req.body;

    if (fee_jmd === undefined || fee_jmd === null) {
      return error(res, 'fee_jmd is required', 400);
    }

    await Settings.upsertFee(visitType, Number(fee_jmd), req.user.id);

    log(req.user.id, ACTIONS.UPDATE_SETTINGS, 'visit_type_fees', null, req.ip, {
      visit_type: visitType, fee_jmd,
    }).catch(() => {});

    const fees = await Settings.getFees();
    return success(res, { fees });
  } catch (err) {
    console.error('updateFee error:', err);
    return error(res, 'Something went wrong', 500);
  }
};
