const assessmentService = require('../services/assessmentService');

class AssessmentController {
  // Create or update highest scores
  async createOrUpdateHighestScores(req, res) {
    try {
      const { scheduleId, school_year, term, highest_scores } = req.body;

      if (!scheduleId || !school_year || !term || !highest_scores) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId, school_year, term, and highest_scores are required',
        });
      }

      const result = await assessmentService.createOrUpdateHighestScores(
        scheduleId,
        school_year,
        term,
        highest_scores
      );

      res.status(200).json({
        success: true,
        message: 'Highest scores saved successfully',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to save highest scores',
      });
    }
  }

  // Create or update individual student assessment (one score at a time)
  async createOrUpdateAssessment(req, res) {
    try {
      const { scheduleId, student_id, school_year, term, scores } = req.body;

      if (!scheduleId || !student_id || !school_year || !term) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId, student_id, school_year, and term are required',
        });
      }

      const result = await assessmentService.createOrUpdateAssessment({
        scheduleId,
        student_id,
        school_year,
        term,
        scores,
      });

      res.status(200).json({
        success: true,
        message: 'Assessment saved successfully',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to save assessment',
      });
    }
  }

  // Get highest scores
  async getHighestScores(req, res) {
    try {
      const { scheduleId, school_year, term } = req.body;

      if (!scheduleId || !school_year) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId and school_year are required',
        });
      }

      const result = await assessmentService.getHighestScores(scheduleId, school_year, term);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Highest scores not found',
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get highest scores',
      });
    }
  }

  // Get assessment for a specific student
  async getAssessment(req, res) {
    try {
      const { scheduleId, student_id, school_year, term } = req.body;

      if (!scheduleId || !student_id || !school_year) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId, student_id, and school_year are required',
        });
      }

      const result = await assessmentService.getAssessment(scheduleId, student_id, school_year, term);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found',
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get assessment',
      });
    }
  }

  // Get all assessments for a schedule (with filters)
  async getAllAssessments(req, res) {
    try {
      const {
        scheduleId,
        school_year,
        term,
        student_id,
        page,
        limit,
      } = req.body;

      if (!scheduleId || !school_year) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId and school_year are required',
        });
      }

      const result = await assessmentService.getAllAssessments(
        scheduleId,
        school_year,
        term,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: result.assessments,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get assessments',
      });
    }
  }

  // Get assessments by filters (for filtering by school_year and term)
  async getAssessmentsByFilters(req, res) {
    try {
      const {
        scheduleId,
        school_year,
        term,
        student_id,
        page,
        limit,
      } = req.body;

      const result = await assessmentService.getAssessmentsByFilters({
        scheduleId,
        school_year,
        term,
        student_id,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.assessments,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get assessments',
      });
    }
  }
}

module.exports = new AssessmentController();

