import { Injectable, Logger } from '@nestjs/common';
import { UserRole, MechanicStatus, WorkshopStatus, VehicleStatus, MaintenanceType, MaintenanceStatus } from '../common/types/enums';
import { PasswordService } from '../common/services/password.service';
import { UsersDao } from '../modules/users/dao/users.dao';
import { MechanicsDao } from '../modules/mechanics/dao/mechanics.dao';
import { WorkshopsDao } from '../modules/workshops/dao/workshops.dao';
import { VehiclesDao } from '../modules/vehicles/dao/vehicles.dao';
import { MaintenancesDao } from '../modules/maintenances/dao/maintenances.dao';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly usersDao: UsersDao,
    private readonly mechanicsDao: MechanicsDao,
    private readonly workshopsDao: WorkshopsDao,
    private readonly vehiclesDao: VehiclesDao,
    private readonly maintenancesDao: MaintenancesDao,
    private readonly passwordService: PasswordService,
  ) {}

  async seed(): Promise<void> {
    // Every seed record has a stable unique key; rerunning this command never creates duplicates.
    const admin = await this.ensureUser('admin@fleetcore.example.com', 'FleetCore Administrator', 'AdminPass123!', UserRole.ADMIN);
    const alex = await this.ensureUser('alex.technician@fleetcore.example.com', 'Alex Rivera', 'TechPass123!', UserRole.TECHNICIAN);
    const jamie = await this.ensureUser('jamie.technician@fleetcore.example.com', 'Jamie Morgan', 'TechPass123!', UserRole.TECHNICIAN);

    const alexMechanic = await this.ensureMechanic({
      name: 'Alex Rivera', email: 'alex.technician@fleetcore.example.com', specialty: 'Preventive maintenance',
      status: MechanicStatus.ACTIVE, userId: alex.id,
    });
    const jamieMechanic = await this.ensureMechanic({
      name: 'Jamie Morgan', email: 'jamie.technician@fleetcore.example.com', specialty: 'Brakes and suspension',
      status: MechanicStatus.ACTIVE, userId: jamie.id,
    });
    const inactiveMechanic = await this.ensureMechanic({
      name: 'Taylor Former', email: 'taylor.former@fleetcore.example.com', specialty: 'Electrical systems',
      status: MechanicStatus.INACTIVE,
    });

    const centralWorkshop = await this.ensureWorkshop('Central Workshop', '123 Industrial Avenue, Barranquilla', WorkshopStatus.ACTIVE);
    await this.ensureWorkshop('North Workshop', '45 North Logistics Road, Barranquilla', WorkshopStatus.INACTIVE);

    const availableVehicle = await this.ensureVehicle({ plate: 'FLC1001', brand: 'Chevrolet', model: 'NPR', year: 2023, mileage: 45500, status: VehicleStatus.AVAILABLE });
    await this.ensureVehicle({ plate: 'FLC1002', brand: 'Isuzu', model: 'NQR', year: 2022, mileage: 32000, status: VehicleStatus.AVAILABLE });
    const maintenanceVehicle = await this.ensureVehicle({ plate: 'FLC1003', brand: 'Hino', model: '300', year: 2021, mileage: 52300, status: VehicleStatus.IN_MAINTENANCE });
    await this.ensureVehicle({ plate: 'FLC1004', brand: 'Ford', model: 'Transit', year: 2020, mileage: 69000, status: VehicleStatus.INACTIVE });

    const completedStart = new Date('2026-09-15T14:00:00.000Z');
    const completedEnd = new Date('2026-09-15T16:00:00.000Z');
    if (!(await this.maintenancesDao.findByReferenceCode('SEED-COMPLETED-001'))) {
      await this.maintenancesDao.create({
        referenceCode: 'SEED-COMPLETED-001', type: MaintenanceType.PREVENTIVE,
        description: 'Historical oil and filter replacement.', mileage: 45000,
        scheduledStartAt: completedStart, scheduledEndAt: completedEnd,
        status: MaintenanceStatus.COMPLETED, workPerformed: 'Changed engine oil and filters; inspected fluid levels.',
        finalCost: 350000, finishedAt: new Date('2026-09-15T16:30:00.000Z'), finalMileage: 45500,
        vehicleId: availableVehicle.id, mechanicId: alexMechanic.id, workshopId: centralWorkshop.id,
      });
    }

    const inProgress = await this.maintenancesDao.findByReferenceCode('SEED-IN-PROGRESS-001');
    if (!inProgress) {
      const now = new Date();
      const start = new Date(now.getTime() - 60 * 60 * 1000);
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      await this.maintenancesDao.create({
        referenceCode: 'SEED-IN-PROGRESS-001', type: MaintenanceType.CORRECTIVE,
        description: 'In-progress brake inspection and replacement.', mileage: 52300,
        scheduledStartAt: start, scheduledEndAt: end,
        status: MaintenanceStatus.IN_PROGRESS, vehicleId: maintenanceVehicle.id,
        mechanicId: jamieMechanic.id, workshopId: centralWorkshop.id,
      });
    }

    this.logger.log('FleetCore seed completed. Existing records were reused where present.');
    this.logger.log(`Admin: admin@fleetcore.example.com / AdminPass123! (user id ${admin.id})`);
    this.logger.log('Technician: alex.technician@fleetcore.example.com / TechPass123!');
    this.logger.log('Technician: jamie.technician@fleetcore.example.com / TechPass123!');
    this.logger.log(`Seeded active mechanics: ${alexMechanic.id}, ${jamieMechanic.id}; inactive mechanic: ${inactiveMechanic.id}.`);
  }

  private async ensureUser(email: string, name: string, password: string, role: UserRole) {
    const existing = await this.usersDao.findByEmail(email);
    if (existing) return existing;
    return this.usersDao.create({
      email, name, role, isActive: true,
      passwordHash: await this.passwordService.hash(password),
    });
  }

  private async ensureMechanic(input: { name: string; email: string; specialty: string; status: MechanicStatus; userId?: number }) {
    const existing = await this.mechanicsDao.findByEmail(input.email);
    if (existing) return existing;
    return this.mechanicsDao.create({
      name: input.name, email: input.email, specialty: input.specialty, status: input.status,
      userId: input.userId,
    });
  }

  private async ensureWorkshop(name: string, address: string, status: WorkshopStatus) {
    const existing = await this.workshopsDao.findByName(name);
    if (existing) return existing;
    return this.workshopsDao.create({ name, address, status });
  }

  private async ensureVehicle(input: { plate: string; brand: string; model: string; year: number; mileage: number; status: VehicleStatus }) {
    const existing = await this.vehiclesDao.findByPlate(input.plate);
    if (existing) return existing;
    return this.vehiclesDao.create(input);
  }
}
