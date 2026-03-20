ALTER TABLE `viagens` ADD `tipo` enum('entrega','viagem') DEFAULT 'viagem' NOT NULL;--> statement-breakpoint
ALTER TABLE `viagens` ADD `tipoCarga` text;--> statement-breakpoint
ALTER TABLE `viagens` ADD `teveProblema` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `viagens` ADD `voltouComCarga` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `viagens` ADD `observacoesChegada` text;