"use client";

import {
  Briefcase,
  User,
  MapPin,
  IdCard,
  GraduationCap,
  Building2,
  Users,
  Award,
  ClipboardList,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/utils";
import type {
  CandidateWithRelations,
  CandidateBiodata,
} from "@/services/candidate.service";

interface ProfileTabProps {
  candidate: CandidateWithRelations;
  biodata: CandidateBiodata | null;
  isBiodataLoading: boolean;
}

export function ProfileTab({ candidate, biodata, isBiodataLoading: _isBiodataLoading }: ProfileTabProps) {
  return (
    <div className="mt-6 space-y-5">
      {/* Application Details */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Application Details</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Candidate Code</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.detail?.candidateCode ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.detail?.candidateCode || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Employee Request</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.employeeRequest?.code ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.employeeRequest?.code || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Position Applied</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.jobTitle?.name ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.jobTitle?.name || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Verification Status</p>
              <div className="mt-1">
                <Badge variant={candidate.verify === "VERIFIED" ? "default" : "secondary"}>
                  {candidate.verify}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Applied Date</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.createdAt ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.createdAt ? formatShortDate(candidate.createdAt) : "No Data"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Personal Information</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Birth Date</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.birthDate ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.birthDate ? formatShortDate(candidate.birthDate) : "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Birth Place</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.birthPlace ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.birthPlace || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Religion</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.religion ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.religion || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Marital Status</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.marritalStatus ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.marritalStatus || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Citizenship</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.citizenship ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.citizenship || "No Data"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Contact Information</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Address</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.address ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.address || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Resident Status</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.residentStatus ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.residentStatus || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mobile Phone</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.mobilePhone ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.mobilePhone || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{candidate.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Identity Documents */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Identity Documents</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <IdCard className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ID Number (KTP)</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.idNo ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.idNo || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Tax ID (NPWP)</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.taxId ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.taxId || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">BPJS ID</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.bpjsId ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.bpjsId || "No Data"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Driving License</p>
              <p className={`mt-0.5 text-sm font-medium ${candidate.drivingLicense ? "text-foreground" : "text-muted-foreground"}`}>
                {candidate.drivingLicense || "No Data"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Background */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Educational Background</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          {biodata?.education && biodata.education.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">School / University</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">City</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Degree</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Major</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {biodata.education.map((edu, index) => (
                    <tr key={edu.id} className={cn("border-b last:border-b-0", index % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                      <td className="py-3 px-4 font-medium">{edu.schoolUniversity}</td>
                      <td className="py-3 px-4 text-muted-foreground">{edu.city}</td>
                      <td className="py-3 px-4 text-muted-foreground">{edu.degree}</td>
                      <td className="py-3 px-4 text-muted-foreground">{edu.major}</td>
                      <td className="py-3 px-4 text-muted-foreground">{edu.yearGraduate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No educational background data available</p>
          )}
        </div>
      </section>

      {/* Work Experience */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Work Experience</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          {biodata?.workExperience && biodata.workExperience.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">City</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Job Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Period</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Length</th>
                  </tr>
                </thead>
                <tbody>
                  {biodata.workExperience.map((exp, index) => (
                    <tr key={exp.id} className={cn("border-b last:border-b-0", index % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                      <td className="py-3 px-4 font-medium">{exp.company}</td>
                      <td className="py-3 px-4 text-muted-foreground">{exp.city}</td>
                      <td className="py-3 px-4 text-muted-foreground">{exp.jobTitle}</td>
                      <td className="py-3 px-4 text-muted-foreground">{exp.period}</td>
                      <td className="py-3 px-4 text-muted-foreground">{exp.lengthOfWorking}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No work experience data available</p>
          )}
        </div>
      </section>

      {/* Family Members */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Family Members</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          {biodata?.family && biodata.family.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Relation</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Age</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Education</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Work</th>
                  </tr>
                </thead>
                <tbody>
                  {biodata.family.map((member, index) => (
                    <tr key={member.id} className={cn("border-b last:border-b-0", index % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                      <td className="py-3 px-4 font-medium">{member.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{member.relation}</td>
                      <td className="py-3 px-4 text-muted-foreground">{member.age}</td>
                      <td className="py-3 px-4 text-muted-foreground">{member.education}</td>
                      <td className="py-3 px-4 text-muted-foreground">{member.work}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No family member data available</p>
          )}
        </div>
      </section>

      {/* Course / Training Experience */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Course / Training Experience</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Award className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          {biodata?.training && biodata.training.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Course Topic</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Provider</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Year</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">City</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {biodata.training.map((course, index) => (
                    <tr key={course.id} className={cn("border-b last:border-b-0", index % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                      <td className="py-3 px-4 font-medium">{course.courseTopic}</td>
                      <td className="py-3 px-4 text-muted-foreground">{course.provider}</td>
                      <td className="py-3 px-4 text-muted-foreground">{course.year}</td>
                      <td className="py-3 px-4 text-muted-foreground">{course.city}</td>
                      <td className="py-3 px-4 text-muted-foreground">{course.certificate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No course/training data available</p>
          )}
        </div>
      </section>

      {/* Self Assessment */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">Self Assessment</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="px-6 py-5">
          {biodata?.selfAssessment ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">What caused you to leave your last job?</p>
                <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px]">
                  <p className="text-sm text-foreground/80 leading-relaxed">{biodata.selfAssessment.reasonLeavingLastJob || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Describe your last job description!</p>
                <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px]">
                  <p className="text-sm text-foreground/80 leading-relaxed">{biodata.selfAssessment.lastJobDescription || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">What is your reason/purpose for applying to this company?</p>
                <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px]">
                  <p className="text-sm text-foreground/80 leading-relaxed">{biodata.selfAssessment.reasonApplying || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">What tasks/jobs are you good at, related to the position you are applying for?</p>
                <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px]">
                  <p className="text-sm text-foreground/80 leading-relaxed">{biodata.selfAssessment.relevantSkills || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Last salary received?</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.lastSalary || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">What salary do you expect?</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.expectedSalary || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Active language?</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.activeLanguage || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Are you willing to transfer/rotate at work?</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.willingToTransfer || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Are you willing to do double work for the company due to limited personnel?</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.willingToDoubleWork || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Who are the employees you know at this company?</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.knownEmployees || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">When are you ready to work?</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.readyToWork || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">What is your relationship with the employee?</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.employeeRelationship || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Your reference contact name</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.referenceContactName || "No Data"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Your reference contact phone no</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/80">{biodata.selfAssessment.referenceContactPhone || "No Data"}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No self assessment data available</p>
          )}
        </div>
      </section>
    </div>
  );
}
