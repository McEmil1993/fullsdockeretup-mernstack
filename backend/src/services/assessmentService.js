const Assessment = require('../models/Assessment');
const AssessmentHighestScores = require('../models/AssessmentHighestScores');
const Schedule = require('../models/Schedule');
const Student = require('../models/Student');

class AssessmentService {
  // Create or update highest scores for a schedule+school_year+term
  async createOrUpdateHighestScores(scheduleId, school_year, term, highestScores) {
    try {
      const existing = await AssessmentHighestScores.findOne({
        scheduleId,
        school_year,
        term: term.toLowerCase(),
      });

      if (existing) {
        // Update existing
        existing.highest_scores = highestScores;
        await existing.save();
        return existing;
      } else {
        // Create new
        const highestScoresDoc = new AssessmentHighestScores({
          scheduleId,
          school_year,
          term: term.toLowerCase(),
          highest_scores: highestScores,
        });
        await highestScoresDoc.save();
        return highestScoresDoc;
      }
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Highest scores already exist for this schedule, school year, and term');
      }
      throw error;
    }
  }

  // Create or update individual student assessment score
  async createOrUpdateAssessment(assessmentData) {
    try {
      const {
        scheduleId,
        student_id,
        school_year,
        term,
        scores,
      } = assessmentData;

      // Verify schedule exists
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Verify student exists
      const student = await Student.findOne({ student_id });
      if (!student) {
        throw new Error('Student not found');
      }

      // Check if student is in the schedule
      if (!schedule.students.includes(student_id)) {
        throw new Error('Student is not enrolled in this schedule');
      }

      // Find existing assessment
      const existing = await Assessment.findOne({
        scheduleId,
        student_id,
        school_year,
        term: term.toLowerCase(),
      });

      if (existing) {
        // Update existing - merge scores (partial update)
        if (scores) {
          if (scores.quizzes) Object.assign(existing.scores.quizzes, scores.quizzes);
          if (scores.activities) Object.assign(existing.scores.activities, scores.activities);
          if (scores.oral) Object.assign(existing.scores.oral, scores.oral);
          if (scores.projects) Object.assign(existing.scores.projects, scores.projects);
          if (scores.attendance !== undefined) existing.scores.attendance = scores.attendance;
          if (scores.exam_score !== undefined) existing.scores.exam_score = scores.exam_score;
        }
        await existing.save();
        return existing;
      } else {
        // Create new
        const assessment = new Assessment({
          scheduleId,
          student_id,
          school_year,
          term: term.toLowerCase(),
          scores: scores || {
            quizzes: {},
            activities: {},
            oral: {},
            projects: {},
            attendance: 0,
            exam_score: 0,
          },
        });
        await assessment.save();
        return assessment;
      }
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Assessment already exists for this schedule, student, school year, and term');
      }
      throw error;
    }
  }

  // Get highest scores for a schedule+school_year+term
  async getHighestScores(scheduleId, school_year, term) {
    try {
      const highestScores = await AssessmentHighestScores.findOne({
        scheduleId,
        school_year,
        term: term ? term.toLowerCase() : undefined,
      }).populate('scheduleId', 'subject_code description');

      return highestScores;
    } catch (error) {
      throw error;
    }
  }

  // Get assessment for a specific student
  async getAssessment(scheduleId, student_id, school_year, term) {
    try {
      const assessment = await Assessment.findOne({
        scheduleId,
        student_id,
        school_year,
        term: term ? term.toLowerCase() : undefined,
      })
        .populate('scheduleId', 'subject_code description')
        .lean();

      return assessment;
    } catch (error) {
      throw error;
    }
  }

  // Get all assessments for a schedule+school_year+term (all students)
  async getAllAssessments(scheduleId, school_year, term, page, limit) {
    try {
      const query = {
        scheduleId,
        school_year,
      };
      if (term) {
        query.term = term.toLowerCase();
      }

      const totalCount = await Assessment.countDocuments(query);
      
      let assessments;
      if (page !== undefined && limit !== undefined) {
        // Pagination enabled
        const skip = (page - 1) * limit;
        assessments = await Assessment.find(query)
          .populate('scheduleId', 'subject_code description')
          .sort({ student_id: 1 })
          .skip(skip)
          .limit(limit)
          .lean();
      } else {
        // No pagination - return all results
        assessments = await Assessment.find(query)
          .populate('scheduleId', 'subject_code description')
          .sort({ student_id: 1 })
          .lean();
      }

      // Populate student details
      const studentIds = [...new Set(assessments.map(a => a.student_id))];
      const students = await Student.find({ student_id: { $in: studentIds } })
        .select('student_id last_name first_name middle_initial')
        .lean();

      const studentMap = {};
      students.forEach(s => {
        studentMap[s.student_id] = s;
      });

      const assessmentsWithStudents = assessments.map(assessment => {
        const student = studentMap[assessment.student_id];
        return {
          ...assessment,
          student_info: student ? {
            student_id: student.student_id,
            last_name: student.last_name,
            first_name: student.first_name,
            middle_initial: student.middle_initial,
            full_name: `${student.last_name}, ${student.first_name}${student.middle_initial ? ` ${student.middle_initial}.` : ''}`,
          } : null,
        };
      });

      return {
        assessments: assessmentsWithStudents,
        pagination: page !== undefined && limit !== undefined ? {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        } : {
          total: totalCount,
          all: true,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get assessments by filters (for filtering by school_year and term)
  async getAssessmentsByFilters(filters = {}) {
    try {
      const {
        scheduleId,
        school_year,
        term,
        student_id,
        page,
        limit,
      } = filters;

      const query = {};
      if (scheduleId) query.scheduleId = scheduleId;
      if (school_year) query.school_year = school_year;
      if (term) query.term = term.toLowerCase();
      if (student_id) query.student_id = student_id;

      const totalCount = await Assessment.countDocuments(query);
      
      let assessments;
      if (page !== undefined && limit !== undefined) {
        // Pagination enabled
        const skip = (page - 1) * limit;
        assessments = await Assessment.find(query)
          .populate('scheduleId', 'subject_code description semester academic_year')
          .sort({ school_year: -1, term: 1, student_id: 1 })
          .skip(skip)
          .limit(limit)
          .lean();
      } else {
        // No pagination - return all results
        assessments = await Assessment.find(query)
          .populate('scheduleId', 'subject_code description semester academic_year')
          .sort({ school_year: -1, term: 1, student_id: 1 })
          .lean();
      }

      // Populate student details if needed
      if (assessments.length > 0) {
        const studentIds = [...new Set(assessments.map(a => a.student_id))];
        const students = await Student.find({ student_id: { $in: studentIds } })
          .select('student_id last_name first_name middle_initial')
          .lean();

        const studentMap = {};
        students.forEach(s => {
          studentMap[s.student_id] = s;
        });

        assessments.forEach(assessment => {
          const student = studentMap[assessment.student_id];
          assessment.student_info = student ? {
            student_id: student.student_id,
            last_name: student.last_name,
            first_name: student.first_name,
            middle_initial: student.middle_initial,
            full_name: `${student.last_name}, ${student.first_name}${student.middle_initial ? ` ${student.middle_initial}.` : ''}`,
          } : null;
        });
      }

      return {
        assessments,
        pagination: page !== undefined && limit !== undefined ? {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        } : {
          total: totalCount,
          all: true,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AssessmentService();

