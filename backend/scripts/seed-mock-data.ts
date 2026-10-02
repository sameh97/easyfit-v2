// Seeds realistic mock data into the gym of an existing user.
//
//   docker compose exec backend node dist/scripts/seed-mock-data.js [email]
//
// Insert-only and idempotent: if the gym already has mock members it does nothing.
// Restart the backend afterwards so the new machine schedules are picked up.
import "reflect-metadata";
import { Transaction } from "sequelize/types";
import { Op } from "sequelize";
import { AppDBConnection } from "../config/database";
import { AppUtils } from "../common/app-utils";
import { User } from "../models/user";
import { Member } from "../models/member";
import { Trainer } from "../models/trainer";
import { GroupTraining } from "../models/group-training";
import { MemberParticipate } from "../models/member-participate";
import { Category } from "../models/category";
import { Product } from "../models/product";
import { Machine } from "../models/machines";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { AppNotification } from "../models/app-notification";

const DEFAULT_EMAIL = "sam@gmail.com";
const MOCK_EMAIL_DOMAIN = "easyfit.mock";
const DAY_MS = 86400000;

const IMAGES = {
  product: "https://easyfit-gym.s3.amazonaws.com/product.jpg",
  machine: "https://easyfit-gym.s3.amazonaws.com/machineeeeeeeeeee.jpg",
};

// Same ids/names the frontend maps in products-page.component.ts
const CATEGORIES: { id: number; name: string }[] = [
  { id: 1, name: "protein" },
  { id: 2, name: "BCAA" },
  { id: 3, name: "Glutamine" },
  { id: 4, name: "Creatine" },
  { id: 5, name: "Clothes" },
];

const MALE_NAMES: string[] = ["Ahmad", "Omar", "Yousef", "Karim", "Tamer", "Rami", "Noam", "Itay", "Daniel", "Amir", "Fadi", "Majd", "Eitan", "Ori", "Samer", "Wael", "Adam", "Yonatan", "Bilal", "Nadim"];
const FEMALE_NAMES: string[] = ["Lina", "Rana", "Maya", "Noa", "Yara", "Dana", "Shira", "Aya", "Rawan", "Tal", "Hala", "Maria", "Lior", "Nour", "Salma", "Yael", "Reem", "Tamar", "Jana", "Mira"];
const LAST_NAMES: string[] = ["Haddad", "Khoury", "Cohen", "Levi", "Nassar", "Mizrahi", "Saleh", "Peretz", "Abbas", "Friedman", "Mansour", "Biton", "Hamdan", "Katz", "Zoabi", "Avraham", "Awad", "Shapiro", "Daher", "Golan"];
const CITIES: string[] = ["Shefa-Amr", "Haifa", "Nazareth", "Kiryat Ata", "Tamra", "Acre", "Karmiel", "Nesher", "Ibillin", "Kafr Kanna"];
const STREETS: string[] = ["Main St", "HaNassi Blvd", "Al-Bishara St", "Herzl St", "Olive St", "HaGefen St", "Carmel Ave", "Al-Quds St"];

// Deterministic RNG so every run produces the same dataset
let rngState = 20260929;
const rand = (): number => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
};
const randInt = (min: number, max: number): number => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(items: T[]): T => items[randInt(0, items.length - 1)];
const pickMany = <T>(items: T[], count: number): T[] => {
  const pool: T[] = [...items];
  const result: T[] = [];
  while (result.length < count && pool.length > 0) {
    result.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
  }
  return result;
};

const phone = (): string => `05${pick(["0", "2", "3", "4", "5"])}${randInt(1000000, 9999999)}`;
const address = (): string => `${randInt(1, 120)} ${pick(STREETS)}, ${pick(CITIES)}`;
const birthDay = (minAge: number, maxAge: number): Date => {
  const now = new Date();
  return new Date(now.getFullYear() - randInt(minAge, maxAge), randInt(0, 11), randInt(1, 28));
};
const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);
const atHour = (date: Date, hour: number): Date => {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const emailFor = (first: string, last: string, n: number): string =>
  `${first}.${last}.${n}@${MOCK_EMAIL_DOMAIN}`.toLowerCase();

async function seed(targetEmail: string): Promise<void> {
  const db = new AppDBConnection();
  await db.connect();

  const user: User | null = await User.findOne({ where: { email: targetEmail } });
  if (!user) {
    throw new Error(`No user with email '${targetEmail}'. Create it first (log in as admin -> create gym/user).`);
  }
  const gymId: number = user.gymId;

  const existingMock: Member | null = await Member.findOne({
    where: { gymId, email: { [Op.like]: `%@${MOCK_EMAIL_DOMAIN}` } },
  });
  if (existingMock) {
    console.log(`Gym ${gymId} already has mock data, nothing to do.`);
    return;
  }

  const now = new Date();
  const year: number = now.getFullYear();
  const currentMonth: number = now.getMonth(); // 0-based
  const transaction: Transaction = await db.createTransaction();

  try {
    // --- Categories (global lookup table the products need) ---
    for (const category of CATEGORIES) {
      await Category.findOrCreate({ where: { id: category.id }, defaults: category as Category, transaction });
    }

    // --- Members: joined across this year (drives the "new members" chart) ---
    const members: Member[] = [];
    for (let i = 0; i < 42; i++) {
      const gender: number = rand() < 0.55 ? 1 : 2;
      const first: string = pick(gender === 1 ? MALE_NAMES : FEMALE_NAMES);
      const last: string = pick(LAST_NAMES);
      // ~20% joined last year, the rest spread over this year up to today
      const joinMonth: number = randInt(0, currentMonth);
      const joinDate: Date =
        i < 8
          ? new Date(year - 1, randInt(0, 11), randInt(1, 28))
          : new Date(year, joinMonth, randInt(1, joinMonth === currentMonth ? Math.min(28, now.getDate()) : 28));
      const endOfMembershipDate: Date = addDays(joinDate, pick([90, 180, 365]));
      members.push(
        await Member.create(
          {
            firstName: first,
            lastName: last,
            phone: phone(),
            birthDay: birthDay(17, 60),
            email: emailFor(first, last, i + 1),
            address: address(),
            isActive: endOfMembershipDate.getTime() > now.getTime(),
            joinDate,
            endOfMembershipDate,
            gender,
            imageURL: null,
            gymId,
          } as Member,
          { transaction }
        )
      );
    }

    // --- Trainers ---
    const trainerSeeds: { first: string; last: string }[] = [
      { first: "Khaled", last: "Nassar" },
      { first: "Maya", last: "Cohen" },
      { first: "Rami", last: "Haddad" },
      { first: "Shira", last: "Levi" },
      { first: "Yousef", last: "Mansour" },
      { first: "Lina", last: "Khoury" },
    ];
    const trainers: Trainer[] = [];
    for (let i = 0; i < trainerSeeds.length; i++) {
      const { first, last } = trainerSeeds[i];
      const joinDate: Date = new Date(year - randInt(1, 4), randInt(0, 11), randInt(1, 28));
      trainers.push(
        await Trainer.create(
          {
            firstName: first,
            lastName: last,
            phone: phone(),
            birthDay: birthDay(24, 45),
            email: emailFor(first, last, 100 + i),
            address: address(),
            isActive: true,
            joinDate,
            certificationDate: addDays(joinDate, -randInt(60, 700)),
            imageURL: null,
            gymId,
          } as Trainer,
          { transaction }
        )
      );
    }

    // --- Group trainings: last two weeks + next two weeks, with participants ---
    const classTypes: string[] = ["HIIT Blast", "Morning Yoga", "Spinning", "CrossFit WOD", "Pilates Core", "Boxing Fundamentals", "Zumba", "Functional Strength"];
    const activeMembers: Member[] = members.filter((m) => m.isActive);
    for (let i = 0; i < 14; i++) {
      const dayOffset: number = i < 5 ? -randInt(1, 14) : randInt(0, 14);
      const type: string = classTypes[i % classTypes.length];
      const training: GroupTraining = await GroupTraining.create(
        {
          startTime: atHour(addDays(now, dayOffset), pick([7, 9, 17, 18, 19, 20])),
          description: `${type}: ${pick(["all levels welcome", "bring a towel and water", "intermediate level", "beginner friendly", "high intensity, 45 min"])}`,
          trainerId: pick(trainers).id,
          gymId,
        } as GroupTraining,
        { transaction }
      );
      const participants: Member[] = pickMany(activeMembers, randInt(4, 12));
      await MemberParticipate.bulkCreate(
        participants.map((m) => ({ groupTrainingID: training.id, memberID: m.id } as MemberParticipate)),
        { transaction }
      );
    }

    // --- Products ---
    const productSeeds: { name: string; description: string; categoryID: number; price: number }[] = [
      { name: "Whey Protein Vanilla", description: "2kg whey isolate, 25g protein per scoop", categoryID: 1, price: 249 },
      { name: "Whey Protein Chocolate", description: "2kg whey concentrate, rich chocolate flavour", categoryID: 1, price: 229 },
      { name: "Vegan Protein", description: "1kg pea and rice protein blend", categoryID: 1, price: 189 },
      { name: "BCAA Watermelon", description: "2:1:1 BCAA powder, 30 servings", categoryID: 2, price: 119 },
      { name: "BCAA Lemon Ice", description: "Intra-workout BCAA with electrolytes", categoryID: 2, price: 129 },
      { name: "L-Glutamine", description: "500g pure micronized glutamine", categoryID: 3, price: 99 },
      { name: "Creatine Monohydrate", description: "300g Creapure creatine, unflavoured", categoryID: 4, price: 109 },
      { name: "Creatine Caps", description: "120 capsules, 3g per serving", categoryID: 4, price: 89 },
      { name: "Easyfit Training Tee", description: "Dry-fit training t-shirt, black", categoryID: 5, price: 79 },
      { name: "Easyfit Hoodie", description: "Heavyweight cotton hoodie with gym logo", categoryID: 5, price: 179 },
      { name: "Training Shorts", description: "Lightweight shorts with zip pocket", categoryID: 5, price: 69 },
      { name: "Lifting Gloves", description: "Padded gloves with wrist support", categoryID: 5, price: 59 },
    ];
    const products: Product[] = [];
    for (let i = 0; i < productSeeds.length; i++) {
      products.push(
        await Product.create(
          {
            ...productSeeds[i],
            code: `G${gymId}-P${String(i + 1).padStart(3, "0")}`,
            quantity: randInt(5, 60),
            imgUrl: IMAGES.product,
            gymId,
          } as Product,
          { transaction }
        )
      );
    }

    // --- Bills: sales spread over this year (drives the sales + income charts) ---
    // Raw insert so createdAt can be backdated.
    const billRows: object[] = [];
    for (let month = 0; month <= currentMonth; month++) {
      const salesThisMonth: number = randInt(6, 14) + month; // gentle growth
      for (let s = 0; s < salesThisMonth; s++) {
        const product: Product = pick(products);
        const buyer: Member = pick(members);
        const quantity: number = randInt(1, 3);
        const maxDay: number = month === currentMonth ? now.getDate() : 28;
        const soldAt: Date = atHour(new Date(year, month, randInt(1, maxDay)), randInt(8, 21));
        billRows.push({
          coustomerID: String(randInt(100000000, 399999999)),
          coustomerName: `${buyer.firstName} ${buyer.lastName}`,
          coustomerPhone: buyer.phone,
          productID: product.id,
          productName: product.name,
          gymId,
          quantity,
          totalCost: product.price * quantity,
          createdAt: soldAt,
          updatedAt: soldAt,
        });
      }
    }
    await Product.sequelize.getQueryInterface().bulkInsert("bill", billRows, { transaction });

    // --- Machines ---
    const machineSeeds: { name: string; description: string; price: number }[] = [
      { name: "Treadmill Pro", description: "Commercial treadmill, 0-20 km/h, 15% incline", price: 18500 },
      { name: "Treadmill Pro", description: "Commercial treadmill, 0-20 km/h, 15% incline", price: 18500 },
      { name: "Elliptical Trainer", description: "Low impact cross trainer with heart rate grips", price: 12900 },
      { name: "Spin Bike", description: "Magnetic resistance indoor cycling bike", price: 4200 },
      { name: "Rowing Machine", description: "Air resistance rower with performance monitor", price: 5600 },
      { name: "Leg Press", description: "45 degree plate loaded leg press", price: 14800 },
      { name: "Smith Machine", description: "Counter-balanced smith machine with safety stops", price: 16200 },
      { name: "Cable Crossover", description: "Dual adjustable pulley station", price: 21000 },
      { name: "Lat Pulldown", description: "Selectorized lat pulldown, 100kg stack", price: 9800 },
      { name: "Chest Press", description: "Selectorized seated chest press", price: 11200 },
    ];
    const machines: Machine[] = [];
    for (let i = 0; i < machineSeeds.length; i++) {
      machines.push(
        await Machine.create(
          {
            ...machineSeeds[i],
            serialNumber: `G${gymId}-SN-${String(1001 + i)}`,
            productionYear: randInt(year - 6, year - 1),
            imgUrl: IMAGES.machine,
            gymId,
          } as Machine,
          { transaction }
        )
      );
    }

    // --- Scheduled maintenance jobs (1 = clean, 2 = service) ---
    const scheduledJobs: MachineScheduledJob[] = [];
    const scheduleSeeds: { machine: Machine; jobID: number; daysFrequency: number }[] = [
      { machine: machines[0], jobID: 1, daysFrequency: 1 },
      { machine: machines[1], jobID: 1, daysFrequency: 1 },
      { machine: machines[3], jobID: 1, daysFrequency: 2 },
      { machine: machines[0], jobID: 2, daysFrequency: 30 },
      { machine: machines[5], jobID: 2, daysFrequency: 60 },
      { machine: machines[7], jobID: 2, daysFrequency: 90 },
    ];
    for (const s of scheduleSeeds) {
      scheduledJobs.push(
        await MachineScheduledJob.create(
          {
            startTime: atHour(addDays(now, -randInt(1, 20)), 6),
            endTime: addDays(now, 180),
            isActive: true,
            daysFrequency: s.daysFrequency,
            jobID: s.jobID,
            machineSerialNumber: s.machine.serialNumber,
            gymId,
          } as unknown as MachineScheduledJob, // model types isActive as the Boolean wrapper
          { transaction }
        )
      );
    }

    // --- A few unread notifications so the bell has something to show ---
    for (const job of scheduledJobs.slice(0, 4)) {
      await AppNotification.create(AppUtils.createNotificationToStoreInDB(job), { transaction });
    }

    await transaction.commit();

    console.log(`Seeded gym ${gymId} (${targetEmail}):`);
    console.log(`  ${members.length} members, ${trainers.length} trainers, 14 group trainings`);
    console.log(`  ${products.length} products, ${billRows.length} sales, ${CATEGORIES.length} categories`);
    console.log(`  ${machines.length} machines, ${scheduledJobs.length} maintenance schedules, 4 notifications`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

seed(process.argv[2] || DEFAULT_EMAIL)
  .catch((error: Error) => {
    console.error(`Seeding failed: ${error.message}`);
    process.exitCode = 1;
  })
  .then(() => User.sequelize?.close());
