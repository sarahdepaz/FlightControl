﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace FlightControlWeb.Models
{
    public class ExternalFlights
    {
        [Key]
        public string flightId { get; set; }
        public string serverId { get; set; }
        public string serverUrl { get; set; }
    }
}