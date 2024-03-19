import jsPDFInvoiceTemplate, { OutputType } from "jspdf-invoice-template";

export function createAppointmentPDF(appointment, patient) {
    var props = {
        outputType: OutputType.Save,
        returnJsPDFDocObject: true,
        fileName: `Recordatorio_Turno_${appointment.date}_${patient.name}${patient.lastName}`,
        orientationLandscape: false,
        compress: true,
        logo: {
            src: "toothForPDF.png",
            type: 'PNG', //optional, when src= data:uri (nodejs case)
            width: 26.66, //aspect ratio = width/height
            height: 26.66,
            margin: {
                top: 0, //negative or positive num, from the current position
                left: 0 //negative or positive num, from the current position
            }
        },
        stamp: {
            inAllPages: true, //by default = false, just in the last page
            src: "https://raw.githubusercontent.com/edisonneza/jspdf-invoice-template/demo/images/qr_code.jpg",
            type: 'JPG', //optional, when src= data:uri (nodejs case)
            width: 20, //aspect ratio = width/height
            height: 20,
            margin: {
                top: 0, //negative or positive num, from the current position
                left: 0 //negative or positive num, from the current position
            }
        },
        business: {
            name: "Consultorio Odontológico Dra. Karina Alvarez",
            address: "Argentina, Mar del Plata, 11 de Septiembre 4075",
            phone: "(+54) 2234 37-8249",
            email: "email@example.com",
            email_1: "info@example.al",
            website: "www.example.al",
        },
        contact: {
            label: "Recordatorio emitido para:",
            name: `${patient.name} ${patient.lastName}`,
            otherInfo: patient.dni,
            ...(patient.address && { address: patient.address }),
            phone: patient.num,
            ...(patient.email && { email: patient.email }),
        },
        invoice: {
            label: "Invoice #: ",
            num: 19,
            invDate: "Payment Date: 01/01/2021 18:12",
            invGenDate: "Invoice Date: 02/02/2021 10:17",
            headerBorder: false,
            tableBodyBorder: false,
            header: [
                {
                    title: "#",
                    style: {
                        width: 10
                    }
                },
                {
                    title: "Title",
                    style: {
                        width: 30
                    }
                },
                {
                    title: "Description",
                    style: {
                        width: 80
                    }
                },
                { title: "Price" },
                { title: "Quantity" },
                { title: "Unit" },
                { title: "Total" }
            ],
            table: Array.from(Array(10), (item, index) => ([
                index + 1,
                "There are many variations ",
                "Lorem Ipsum is simply dummy text dummy text ",
                200.5,
                4.5,
                "m2",
                400.5
            ])),
            additionalRows: [{
                col1: 'Total:',
                col2: '145,250.50',
                col3: 'ALL',
                style: {
                    fontSize: 14 //optional, default 12
                }
            },
            {
                col1: 'VAT:',
                col2: '20',
                col3: '%',
                style: {
                    fontSize: 10 //optional, default 12
                }
            },
            {
                col1: 'SubTotal:',
                col2: '116,199.90',
                col3: 'ALL',
                style: {
                    fontSize: 10 //optional, default 12
                }
            }],
            invDescLabel: "Invoice Note",
            invDesc: "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary.",
        },
        footer: {
            text: "The invoice is created on a computer and is valid without the signature and stamp.",
        },
        pageEnable: true,
        pageLabel: "Page ",
    };

    const pdfObject = jsPDFInvoiceTemplate(props);
    return pdfObject;
}

