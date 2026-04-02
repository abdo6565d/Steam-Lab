import React, { useState } from 'react';
import { Student, INITIAL_STUDENTS, PROJECTS, Status } from '../constants';
import { Users, UserPlus, Plus, AlertCircle, CheckCircle2, Clock, MoreVertical, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function StudentTracker() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-lab-accent w-5 h-5" />
            Student Tracker
          </h2>
          <p className="text-sm text-lab-muted">Monitor progress and log pedagogical insights</p>
        </div>
        <button
          onClick={() => setIsAddingStudent(true)}
          className="bg-lab-accent hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lab-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-lab-card border border-lab-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent"
            />
          </div>
          <div className="space-y-2">
            {filteredStudents.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                  selectedStudentId === student.id 
                    ? "bg-lab-accent/10 border-lab-accent text-white" 
                    : "bg-lab-card border-lab-border text-lab-muted hover:border-lab-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-lab-border flex items-center justify-center text-xs font-bold">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-sm font-medium">{student.name}</span>
                </div>
                <div className="text-[10px] font-bold bg-black/30 px-1.5 py-0.5 rounded">
                  {student.progress.length}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedStudent ? (
              <motion.div
                key={selectedStudent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-lab-card border border-lab-border rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedStudent.name}</h3>
                      <p className="text-sm text-lab-muted">Student Profile & Progress History</p>
                    </div>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-lab-muted" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-lab-accent">Active Projects</h4>
                      <button className="text-xs font-bold text-lab-muted hover:text-white flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Assign Project
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {selectedStudent.progress.map((prog, idx) => {
                        const project = PROJECTS.find(p => p.id === prog.projectId);
                        return (
                          <div key={idx} className="bg-black/20 border border-lab-border rounded-xl p-5 space-y-4">
                            <div className="flex justify-between items-center">
                              <h5 className="font-bold text-white">{project?.name}</h5>
                              <StatusBadge status={prog.status} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase">
                                  <AlertCircle className="w-3 h-3" />
                                  Observed Errors
                                </div>
                                <ul className="text-xs text-lab-muted space-y-1 list-disc pl-4">
                                  {prog.errors.map((err, i) => <li key={i}>{err}</li>)}
                                  {prog.errors.length === 0 && <li className="list-none pl-0 italic">No errors logged</li>}
                                </ul>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Successful Approaches
                                </div>
                                <ul className="text-xs text-lab-muted space-y-1 list-disc pl-4">
                                  {prog.successes.map((suc, i) => <li key={i}>{suc}</li>)}
                                  {prog.successes.length === 0 && <li className="list-none pl-0 italic">No successes logged</li>}
                                </ul>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-lab-border flex justify-between items-center">
                              <span className="text-[10px] text-lab-muted">Last updated: {new Date(prog.lastUpdated).toLocaleDateString()}</span>
                              <button className="text-xs font-bold text-lab-accent hover:underline">Update Log</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-lab-card/50 border border-dashed border-lab-border rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-lab-card flex items-center justify-center">
                  <Users className="text-lab-muted w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-white">No Student Selected</h3>
                  <p className="text-sm text-lab-muted max-w-xs mx-auto">Select a student from the list to view their progress and log insights.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isAddingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-lab-card border border-lab-border rounded-2xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-xl font-bold">Add New Student</h3>
            <div className="space-y-3">
              <input placeholder="Full Name" className="w-full bg-black/30 border border-lab-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsAddingStudent(false)} className="px-4 py-2 text-sm font-medium text-lab-muted hover:text-white">Cancel</button>
              <button onClick={() => setIsAddingStudent(false)} className="bg-lab-accent px-6 py-2 rounded-xl text-sm font-bold text-white">Add Student</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
      status === 'Completed' ? "bg-green-500/10 text-green-400" :
      status === 'Progressing' ? "bg-orange-500/10 text-orange-400" :
      "bg-red-500/10 text-red-400"
    )}>
      {status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> :
       status === 'Progressing' ? <Clock className="w-3 h-3" /> :
       <AlertCircle className="w-3 h-3" />}
      {status}
    </div>
  );
}
