export type Livro = {
   id: string;
   title: string;
   author: string;
   genre: string;
   status: Status;
   image: string;
   systemEntryDate: string;
   synopsis: string;
   rentHistory: RentHistory[];
}

export type RentHistory = {
   studentName: string;
   class: string;
   withdrawalDate: string;
   deliveryDate: string
}

export type Status = {
   isRented: boolean;
   isActive: boolean;
   description: string;
}