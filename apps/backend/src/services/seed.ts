import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedContactsIfEmpty = async () => {
  const count = await prisma.contact.count();
  if (count > 0) return;

  const tags = ['Lead', 'Prospect', 'Client', 'VIP'];
  const createdTags = await Promise.all(
    tags.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const contacts = await prisma.contact.createMany({
    data: [
      {
        name: 'Popescu Andrei',
        contactPersonName: 'Ionescu Maria',
        email: 'andrei.popescu@example.com',
        phone: '+40 721 123 456',
        company: 'Popescu Group',
        notes: 'Interested in enterprise plan.',
      },
      {
        name: 'Ionescu Elena',
        contactPersonName: 'Vasilescu Dan',
        email: 'elena.ionescu@example.com',
        phone: '+40 722 555 111',
        company: 'Elenas SRL',
        notes: 'Asked for a demo.',
      },
      {
        name: 'Dumitru Mihai',
        contactPersonName: 'Dumitru Alina',
        email: 'mihai.dumitru@example.com',
        phone: '+40 723 222 333',
        company: 'DM Consulting',
        notes: 'Follow-up next week.',
      },
      {
        name: 'Georgescu Ana',
        contactPersonName: 'Popa Radu',
        email: 'ana.georgescu@example.com',
        phone: '+40 724 777 888',
        company: 'Ana Design',
        notes: 'Potential long-term client.',
      },
      {
        name: 'Marinescu Vlad',
        contactPersonName: 'Marinescu Ioana',
        email: 'vlad.marinescu@example.com',
        phone: '+40 725 999 000',
        company: 'VM Tech',
        notes: 'Requested pricing list.',
      },
    ],
  });

  const created = await prisma.contact.findMany({
    orderBy: { id: 'asc' },
  });

  const tagMap = {
    Lead: createdTags[0].id,
    Prospect: createdTags[1].id,
    Client: createdTags[2].id,
    VIP: createdTags[3].id,
  } as const;

  const assignments = [
    { contactId: created[0].id, tagId: tagMap.Lead },
    { contactId: created[1].id, tagId: tagMap.Prospect },
    { contactId: created[2].id, tagId: tagMap.Client },
    { contactId: created[3].id, tagId: tagMap.VIP },
    { contactId: created[4].id, tagId: tagMap.Prospect },
  ];

  await prisma.contactTag.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  return contacts;
};
