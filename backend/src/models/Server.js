const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  block: {
    type: Number,
    required: true
  },
  group: {
    type: Number,
    required: true
  },
  sshUser: {
    type: String,
    required: true,
    trim: true
  },
  sshHost: {
    type: String,
    required: true,
    trim: true
  },
  sshPassword: {
    type: String,
    required: true
  },
  webHost: {
    type: String,
    required: true,
    trim: true
  },
  backendHost: {
    type: String,
    required: true,
    trim: true
  },
  socketHost: {
    type: String,
    required: true,
    trim: true
  },
  portsInsideDocker: {
    type: String,
    required: true,
    default: '3000 / 3001 / 3002'
  },
  status: {
    type: String,
    enum: ['Active', 'Deactivated'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Index for faster queries
serverSchema.index({ block: 1, group: 1 });
serverSchema.index({ status: 1 });

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;
