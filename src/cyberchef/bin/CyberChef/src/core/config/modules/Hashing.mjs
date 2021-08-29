/**
* THIS FILE IS AUTOMATICALLY GENERATED BY src/core/config/scripts/generateConfig.mjs
*
* @author n1474335 [n1474335@gmail.com]
* @copyright Crown Copyright 2021
* @license Apache-2.0
*/
import BLAKE2b from "../../operations/BLAKE2b.mjs";
import BLAKE2s from "../../operations/BLAKE2s.mjs";
import ConvertCoordinateFormat from "../../operations/ConvertCoordinateFormat.mjs";
import GOSTHash from "../../operations/GOSTHash.mjs";
import ShowOnMap from "../../operations/ShowOnMap.mjs";
import Streebog from "../../operations/Streebog.mjs";

const OpModules = typeof self === "undefined" ? {} : self.OpModules || {};

OpModules.Hashing = {
    "BLAKE2b": BLAKE2b,
    "BLAKE2s": BLAKE2s,
    "Convert co-ordinate format": ConvertCoordinateFormat,
    "GOST hash": GOSTHash,
    "Show on map": ShowOnMap,
    "Streebog": Streebog,
};

export default OpModules;