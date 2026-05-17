import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { SeedUsers } from './types.ts';

export async function seedHr(prisma: PrismaClient, users: SeedUsers) {
  const dept = await prisma.department.create({
    data: {
      name: 'Operations',
      code: 'DEPT-OPS',
      description: 'Demo department',
    },
  });

  const employee = await prisma.employee.create({
    data: {
      user_id: users.employeeUserId,
      department_id: dept.id,
      employee_code: 'EMP-SEED-001',
      position: 'Support Specialist',
      salary: new Prisma.Decimal(12000),
      hire_date: new Date('2023-01-15'),
      national_id: '29701010100123',
      contract_type: 'full_time',
      status: 'active',
    },
  });

  await prisma.department.update({
    where: { id: dept.id },
    data: { manager_id: employee.id },
  });

  const perm = await prisma.permission.create({
    data: {
      module: 'products',
      action: 'read',
      key: 'products.read',
    },
  });

  await prisma.employeePermission.create({
    data: {
      employee_id: employee.id,
      permission_id: perm.id,
    },
  });

  await prisma.attendance.create({
    data: {
      employee_id: employee.id,
      date: new Date('2024-06-01'),
      status: 'present',
      check_in: new Date('2024-06-01T09:00:00Z'),
      check_out: new Date('2024-06-01T17:00:00Z'),
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employee_id: employee.id,
      type: 'annual',
      start_date: new Date('2024-12-01'),
      end_date: new Date('2024-12-03'),
      total_days: 3,
      reason: 'Family trip (demo)',
      status: 'approved',
      approved_by: users.adminId,
      approved_at: new Date(),
    },
  });

  await prisma.payroll.create({
    data: {
      employee_id: employee.id,
      month: 1,
      year: 2024,
      basic_salary: new Prisma.Decimal(12000),
      allowances: new Prisma.Decimal(500),
      deductions: new Prisma.Decimal(200),
      net_salary: new Prisma.Decimal(12300),
      status: 'paid',
      paid_at: new Date(),
      created_by: users.adminId,
    },
  });
}
