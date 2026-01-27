/**
 * Assessment Management API Service
 * Handles all assessment-related API calls
 */

import { post } from './api'

/**
 * Create or update highest scores for a schedule
 * @param {object} highestScoresData - Highest scores data
 * @param {string} highestScoresData.scheduleId - Schedule MongoDB ID (required)
 * @param {string} highestScoresData.school_year - School year (required)
 * @param {string} highestScoresData.term - Term (prelim|midterm|semi-final|final) (required)
 * @param {object} highestScoresData.highest_scores - Highest scores object (required)
 * @returns {Promise<{data: object, success: boolean, message: string}>}
 */
export async function createOrUpdateHighestScores(highestScoresData) {
  const { data } = await post('/api/assessments/highest-scores', highestScoresData)
  return {
    data: data.data || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get highest scores for a schedule
 * @param {object} params - Query parameters
 * @param {string} params.scheduleId - Schedule MongoDB ID (required)
 * @param {string} params.school_year - School year (required)
 * @param {string} [params.term] - Term (prelim|midterm|semi-final|final)
 * @returns {Promise<{data: object, success: boolean}>}
 */
export async function getHighestScores(params) {
  const { data } = await post('/api/assessments/highest-scores/get', params)
  return {
    data: data.data || data,
    success: data.success,
  }
}

/**
 * Create or update assessment for a student (one score at a time)
 * @param {object} assessmentData - Assessment data
 * @param {string} assessmentData.scheduleId - Schedule MongoDB ID (required)
 * @param {string} assessmentData.student_id - Student ID (required)
 * @param {string} assessmentData.school_year - School year (required)
 * @param {string} assessmentData.term - Term (prelim|midterm|semi-final|final) (required)
 * @param {object} [assessmentData.scores] - Scores object (partial update allowed)
 * @returns {Promise<{data: object, success: boolean, message: string}>}
 */
export async function createOrUpdateAssessment(assessmentData) {
  const { data } = await post('/api/assessments', assessmentData)
  return {
    data: data.data || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get assessment for a specific student
 * @param {object} params - Query parameters
 * @param {string} params.scheduleId - Schedule MongoDB ID (required)
 * @param {string} params.student_id - Student ID (required)
 * @param {string} params.school_year - School year (required)
 * @param {string} [params.term] - Term (prelim|midterm|semi-final|final)
 * @returns {Promise<{data: object, success: boolean}>}
 */
export async function getAssessment(params) {
  const { data } = await post('/api/assessments/get', params)
  return {
    data: data.data || data,
    success: data.success,
  }
}

/**
 * Get all assessments for a schedule
 * @param {object} params - Query parameters
 * @param {string} params.scheduleId - Schedule MongoDB ID (required)
 * @param {string} params.school_year - School year (required)
 * @param {string} [params.term] - Term (prelim|midterm|semi-final|final)
 * @param {string} [params.student_id] - Filter by student ID
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<{data: array, pagination: object, success: boolean}>}
 */
export async function getAllAssessments(params) {
  const { data } = await post('/api/assessments/get-all', params)
  return {
    data: data.data || [],
    pagination: data.pagination || {},
    success: data.success,
  }
}

/**
 * Get assessments by filters
 * @param {object} params - Filter parameters (all optional)
 * @param {string} [params.scheduleId] - Schedule MongoDB ID
 * @param {string} [params.school_year] - School year
 * @param {string} [params.term] - Term (prelim|midterm|semi-final|final)
 * @param {string} [params.student_id] - Student ID
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<{data: array, pagination: object, success: boolean}>}
 */
export async function getAssessmentsByFilters(params = {}) {
  const { data } = await post('/api/assessments/get-by-filters', params)
  return {
    data: data.data || [],
    pagination: data.pagination || {},
    success: data.success,
  }
}

export default {
  createOrUpdateHighestScores,
  getHighestScores,
  createOrUpdateAssessment,
  getAssessment,
  getAllAssessments,
  getAssessmentsByFilters,
}

