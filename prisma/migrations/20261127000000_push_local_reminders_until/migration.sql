-- Lembretes agendados no celular: até que dia o aparelho já agendou (o
-- servidor não manda o push de reserva até lá). Só acrescenta.
ALTER TABLE "ExpoPushToken" ADD COLUMN "localRemindersUntil" DATE;
