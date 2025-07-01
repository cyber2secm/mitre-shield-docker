const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const DetectionRule = require('../models/DetectionRule');
const MitreTechnique = require('../models/MitreTechnique');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await DetectionRule.deleteMany({});
    await MitreTechnique.deleteMany({});
    console.log('Cleared existing data');

    // Create default user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      name: 'Security Analyst',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });
    await user.save();
    console.log('Created default user: admin@example.com / password123');

    // Create sample MITRE techniques
    const techniques = [
      {
        technique_id: 'T1059',
        name: 'Command and Scripting Interpreter',
        description: 'Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.',
        tactic: 'Execution',
        platforms: ['Windows', 'macOS', 'Linux'],
        data_sources: ['Process', 'Command']
      },
      {
        technique_id: 'T1059.001',
        name: 'PowerShell',
        description: 'Adversaries may abuse PowerShell commands and scripts for execution.',
        tactic: 'Execution',
        platforms: ['Windows'],
        data_sources: ['Process', 'PowerShell Logs'],
        is_subtechnique: true
      },
      {
        technique_id: 'T1105',
        name: 'Ingress Tool Transfer',
        description: 'Adversaries may transfer tools or other files from an external system into a compromised environment.',
        tactic: 'Command and Control',
        platforms: ['Windows', 'macOS', 'Linux'],
        data_sources: ['Network Traffic', 'File']
      },
      {
        technique_id: 'T1078',
        name: 'Valid Accounts',
        description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access.',
        tactic: 'Initial Access',
        platforms: ['Windows', 'macOS', 'Linux', 'AWS', 'Azure'],
        data_sources: ['Authentication logs', 'Process']
      },
      {
        technique_id: 'T1055',
        name: 'Process Injection',
        description: 'Adversaries may inject code into processes in order to evade process-based defenses.',
        tactic: 'Defense Evasion',
        platforms: ['Windows', 'macOS', 'Linux'],
        data_sources: ['Process', 'API monitoring']
      },
      {
        technique_id: 'T1003',
        name: 'OS Credential Dumping',
        description: 'Adversaries may attempt to dump credentials to obtain account login and credential material.',
        tactic: 'Credential Access',
        platforms: ['Windows', 'macOS', 'Linux'],
        data_sources: ['Process', 'Command', 'API monitoring']
      },
      {
        technique_id: 'T1082',
        name: 'System Information Discovery',
        description: 'An adversary may attempt to get detailed information about the operating system and hardware.',
        tactic: 'Discovery',
        platforms: ['Windows', 'macOS', 'Linux'],
        data_sources: ['Process', 'Command']
      },
      {
        technique_id: 'T1021',
        name: 'Remote Services',
        description: 'Adversaries may use Valid Accounts to log into a service specifically designed to accept remote connections.',
        tactic: 'Lateral Movement',
        platforms: ['Windows', 'macOS', 'Linux'],
        data_sources: ['Authentication logs', 'Network Traffic']
      }
    ];

    await MitreTechnique.insertMany(techniques);
    console.log(`Created ${techniques.length} MITRE techniques`);

    // Create sample detection rules
    const rules = [
      {
        rule_id: 'RULE-001',
        name: 'Suspicious PowerShell Execution',
        description: 'Detects suspicious PowerShell command execution patterns',
        technique_id: 'T1059.001',
        platform: 'Windows',
        tactic: 'Execution',
        status: 'Active',
        xql_query: 'dataset = xdr_data | filter agent_os_type = AGENT_OS_WINDOWS and action_process_image_name = "powershell.exe" and action_process_command_line contains "-EncodedCommand"',
        tags: ['powershell', 'execution', 'encoded'],
        severity: 'High',
        false_positive_rate: 'Low',
        assigned_user: 'Security Team',
        created_by: user._id,
        updated_by: user._id
      },
      {
        rule_id: 'RULE-002',
        name: 'File Download via PowerShell',
        description: 'Detects file downloads using PowerShell wget or Invoke-WebRequest',
        technique_id: 'T1105',
        platform: 'Windows',
        tactic: 'Command and Control',
        status: 'Active',
        xql_query: 'dataset = xdr_data | filter agent_os_type = AGENT_OS_WINDOWS and action_process_command_line contains "Invoke-WebRequest" or action_process_command_line contains "wget"',
        tags: ['download', 'powershell', 'c2'],
        severity: 'Medium',
        false_positive_rate: 'Medium',
        assigned_user: 'SOC Analyst',
        created_by: user._id,
        updated_by: user._id
      },
      {
        rule_id: 'RULE-003',
        name: 'Process Injection Detection',
        description: 'Detects potential process injection techniques',
        technique_id: 'T1055',
        platform: 'Windows',
        tactic: 'Defense Evasion',
        status: 'Testing',
        xql_query: 'dataset = xdr_data | filter agent_os_type = AGENT_OS_WINDOWS and action_process_injected_module != null',
        tags: ['injection', 'evasion'],
        severity: 'High',
        false_positive_rate: 'High',
        assigned_user: 'Maria Prusskov',
        created_by: user._id,
        updated_by: user._id
      },
      {
        rule_id: 'RULE-004',
        name: 'Credential Dumping Activity',
        description: 'Detects potential credential dumping using common tools',
        technique_id: 'T1003',
        platform: 'Windows',
        tactic: 'Credential Access',
        status: 'Active',
        xql_query: 'dataset = xdr_data | filter agent_os_type = AGENT_OS_WINDOWS and (action_process_image_name contains "mimikatz" or action_process_image_name contains "procdump")',
        tags: ['credentials', 'dumping', 'mimikatz'],
        severity: 'Critical',
        false_positive_rate: 'Low',
        assigned_user: 'Isaac Krzywanowski',
        created_by: user._id,
        updated_by: user._id
      },
      {
        rule_id: 'RULE-005',
        name: 'System Information Gathering',
        description: 'Detects system reconnaissance commands',
        technique_id: 'T1082',
        platform: 'Windows',
        tactic: 'Discovery',
        status: 'Testing',
        xql_query: 'dataset = xdr_data | filter agent_os_type = AGENT_OS_WINDOWS and (action_process_image_name = "systeminfo.exe" or action_process_command_line contains "Get-ComputerInfo")',
        tags: ['reconnaissance', 'discovery'],
        severity: 'Low',
        false_positive_rate: 'High',
        assigned_user: 'Leeroy Perera',
        created_by: user._id,
        updated_by: user._id
      }
    ];

    await DetectionRule.insertMany(rules);
    console.log(`Created ${rules.length} detection rules`);

    console.log('\n=== SEED COMPLETE ===');
    console.log('Login credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    console.log('\nDatabase seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase(); 