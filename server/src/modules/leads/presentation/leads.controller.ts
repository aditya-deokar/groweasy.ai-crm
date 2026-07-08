import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { LeadsRepository } from '../infrastructure/database/leads.repository.js';
import { sendSuccess, sendError } from '../../../shared/presentation/responses/response-sender.js';
import type { LeadIdParams, ListLeadsQuery, UpdateLeadBody } from './leads.schemas.js';

export class LeadsController {
  public constructor(private readonly repository: LeadsRepository) {}

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.validated?.query ?? req.query) as ListLeadsQuery;
      const page = query.page;
      const limit = query.limit;
      const offset = (page - 1) * limit;

      const { leads, totalCount } = await this.repository.listLeads({
        limit,
        offset,
        search: query.search,
        status: query.status,
        source: query.source,
      });

      sendSuccess(
        req,
        res,
        {
          leads,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit),
          },
        },
        'Leads fetched successfully.'
      );
    } catch (error) {
      sendError(
        req,
        res,
        error instanceof Error ? error.message : 'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR,
        'LIST_LEADS_FAILED'
      );
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id: leadId } = req.params as LeadIdParams;
      const body = req.body as UpdateLeadBody;

      const updated = await this.repository.updateLead(leadId, body);

      sendSuccess(req, res, updated, 'Lead updated successfully.');
    } catch (error) {
      if (isLeadNotFoundError(error)) {
        sendError(
          req,
          res,
          error.message,
          StatusCodes.NOT_FOUND,
          'LEAD_NOT_FOUND'
        );
        return;
      }

      sendError(
        req,
        res,
        error instanceof Error ? error.message : 'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR,
        'UPDATE_LEAD_FAILED'
      );
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id: leadId } = req.params as LeadIdParams;

      await this.repository.deleteLead(leadId);

      sendSuccess(req, res, null, 'Lead deleted successfully.');
    } catch (error) {
      if (isLeadNotFoundError(error)) {
        sendError(
          req,
          res,
          error.message,
          StatusCodes.NOT_FOUND,
          'LEAD_NOT_FOUND'
        );
        return;
      }

      sendError(
        req,
        res,
        error instanceof Error ? error.message : 'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR,
        'DELETE_LEAD_FAILED'
      );
    }
  }
}

function isLeadNotFoundError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('not found');
}
